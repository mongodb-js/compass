import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { Document } from 'bson';
import { isEqual } from 'lodash';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { Relationship } from '../services/data-model-storage';

/**
 * A very simplistic depth-first traversing function that only handles a subset
 * of real JSON schema keywords that is applicable to our MongoDB JSON schema
 * format
 */
function traverseMongoDBJSONSchema(
  schema: MongoDBJSONSchema,
  visitor: (schema: MongoDBJSONSchema, path: string[]) => void,
  path: string[] = []
) {
  if (schema.anyOf) {
    for (const s of schema.anyOf) {
      traverseMongoDBJSONSchema(s, visitor, path);
    }
    return;
  }

  visitor(schema, path);

  if (schema.items) {
    for (const s of Array.isArray(schema.items)
      ? schema.items
      : [schema.items]) {
      traverseMongoDBJSONSchema(s, visitor, path);
    }
  } else if (schema.properties) {
    for (const [key, s] of Object.entries(schema.properties)) {
      traverseMongoDBJSONSchema(s, visitor, [...path, key]);
    }
  }
}

function findPropertyPathsMatchingSchema(
  schema: MongoDBJSONSchema,
  schemaToMatch: MongoDBJSONSchema
): string[][] {
  const properties: string[][] = [];
  traverseMongoDBJSONSchema(schema, (s, path) => {
    if (
      path[0] !== '_id' &&
      s.bsonType === schemaToMatch.bsonType &&
      isEqual(s, schemaToMatch)
    ) {
      properties.push(path);
    }
  });
  return properties;
}

function getValuesFromPath(doc: Document, path: string[]): Document[] {
  const [currentPath, ...restPath] = path;
  // We're at the end of the path, return current doc
  if (!currentPath) {
    return [doc];
  }
  // Path doesn't exist in this document
  if (!(currentPath in doc)) {
    return [];
  }
  const slice = doc[currentPath];
  // For arrays, recursively pick up all the values for provided path
  if (Array.isArray(slice)) {
    return slice.flatMap((item) => {
      return getValuesFromPath(item, restPath);
    });
  }
  // Otherwise just continue moving forward through the path
  return getValuesFromPath(slice, restPath);
}

export async function inferForeignToLocalRelationshipsForCollection(
  foreignNamespace: string,
  foreignSchema: MongoDBJSONSchema,
  _sampleDocs: Document[],
  collections: { ns: string; schema: MongoDBJSONSchema; sample: Document[] }[],
  dataService: DataService,
  abortSignal?: AbortSignal
): Promise<Relationship['relationship'][]> {
  const idSchema = foreignSchema.properties?._id;
  if (!idSchema) {
    return [];
  }
  const indexes = await dataService
    .indexes(foreignNamespace, { full: false })
    .catch(() => {
      return [];
    });
  const hasIdIndex = indexes.some((definition) => {
    return (
      definition.fields.length === 1 && definition.fields[0].field === '_id'
    );
  });
  if (!hasIdIndex) {
    return [];
  }
  const relationships = await Promise.all(
    collections.flatMap((localColl) => {
      if (localColl.ns === foreignNamespace) {
        return [];
      }
      const schemaPaths = findPropertyPathsMatchingSchema(
        localColl.schema,
        idSchema
      );
      return schemaPaths.map(
        async (propPath): Promise<Relationship['relationship'] | null> => {
          try {
            const sampleDocs = localColl.sample
              .flatMap((doc) => {
                return getValuesFromPath(doc, propPath);
              })
              .slice(0, 100);
            if (sampleDocs.length === 0) {
              return null;
            }
            const matchingDocCount = await dataService.count(
              foreignNamespace,
              {
                _id: {
                  $in: sampleDocs as any[], // TODO: driver wants this to be an ObjectId?
                },
              },
              { maxTimeMS: 10_000 },
              { abortSignal, fallbackReadPreference: 'secondaryPreferred' }
            );
            if (matchingDocCount !== sampleDocs.length) {
              return null;
            }
            return [
              { ns: localColl.ns, fields: propPath, cardinality: 1 },
              { ns: foreignNamespace, fields: ['_id'], cardinality: 1 },
            ] as const;
          } catch {
            // TODO: logging
            return null;
          }
        }
      );
    })
  );
  return relationships.filter((val): val is Relationship['relationship'] => {
    return !!val;
  });
}
