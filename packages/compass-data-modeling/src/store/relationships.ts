import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { Document } from 'bson';
import { isEqual } from 'lodash';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { Relationship } from '../services/data-model-storage';
import { traverseMongoDBJSONSchema } from './diagram';

export function findPropertyPathsMatchingSchema(
  schema: MongoDBJSONSchema,
  schemaToMatch: MongoDBJSONSchema
): string[][] {
  const properties: string[][] = [];
  traverseMongoDBJSONSchema(schemaToMatch, (s, path) => {
    if (
      path[0] !== '_id' &&
      s.bsonType === schema.bsonType &&
      isEqual(s, schema)
    ) {
      properties.push(path);
    }
  });
  return properties;
}

export function getValuesFromPath(doc: Document, path: string[]): Document[] {
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

export function findPropertyPathsMatchingDocs(
  doc: Document,
  pathsToCheck: string[][],
  docsToMatch: Document[]
): string[][] {
  const matchingPaths = [];
  for (const path of pathsToCheck) {
    const value = getValuesFromPath(doc, path);
    const matching = docsToMatch.some((doc) => {
      return isEqual(value, doc);
    });
    if (matching) {
      matchingPaths.push(path);
    }
  }
  return matchingPaths;
}

export function buildRelationshipCheckQueryFromIds(
  sampleIds: Document[],
  matchingPaths: string[][]
): Document {
  return {
    $or: matchingPaths.map((propPath) => {
      return { [propPath.join('.')]: { $in: sampleIds } };
    }),
  };
}

/**
 * An algorightm that tries to automatically infer possible relationships to
 * other collections in a database starting from the _id field assuming that it
 * will be a foreign key referenced in some other collection.
 */
export async function inferForeignToLocalRelationshipsForCollection(
  namespace: string,
  schema: MongoDBJSONSchema,
  sampleDocs: Document[],
  collections: { ns: string; schema: MongoDBJSONSchema }[],
  dataService: DataService,
  abortSignal?: AbortSignal
): Promise<Relationship['relationship'][]> {
  const idSchema = schema.properties?._id;
  if (!idSchema) {
    return [];
  }
  const relationships = await Promise.all(
    collections.map(async (coll): Promise<Relationship['relationship'][]> => {
      const schemaPropertyPaths = findPropertyPathsMatchingSchema(
        idSchema,
        coll.schema
      );
      const idsToMatch = sampleDocs.map((doc) => {
        return doc._id as Document;
      });
      const query = buildRelationshipCheckQueryFromIds(
        idsToMatch,
        schemaPropertyPaths
      );
      const [matchingDoc] = await dataService
        .find(
          coll.ns,
          query,
          {
            limit: 1,
            maxTimeMS: 5_000,
          },
          { abortSignal }
        )
        .catch(() => {
          return [];
        });
      if (!matchingDoc) {
        return [];
      }
      const matchingPropertyPaths = findPropertyPathsMatchingDocs(
        matchingDoc,
        schemaPropertyPaths,
        idsToMatch
      );
      return matchingPropertyPaths.map((propPath) => {
        return [
          { ns: coll.ns, fields: propPath, cardinality: 1 },
          { ns: namespace, fields: ['_id'], cardinality: 1 },
        ] as const;
      });
    })
  );
  return relationships.flat();
}

/**
 * An algorithm that tries to automatically infer possible relationships
 * starting from a local collection and assuming that any fields that are either
 * indexed or ObjectIds are pointing to some other foreign collection in the
 * database
 */
export async function inferLocalToForeignRelationshipsForCollection(
  namespace: string,
  schema: MongoDBJSONSchema,
  sampleDocs: Document[],
  collections: { ns: string; schema: MongoDBJSONSchema }[],
  dataService: DataService,
  abortSignal?: AbortSignal
): Promise<Relationship['relationship'][]> {
  const indexes = await dataService.indexes(namespace).catch(() => {
    return null;
  });
  const indexesFields = new Set(
    indexes?.flatMap((index) => {
      return index.fields.flatMap((field) => {
        return typeof field.value === 'number' ? field.field : [];
      });
    })
  );
  const schemaPropertyPaths: string[][] = [];
  traverseMongoDBJSONSchema(schema, (schema, path) => {
    if (
      path[0] !== '_id' &&
      // Assuming existing index indicate that the field is pointing to an id in
      // a different namespace.
      (indexesFields.has(
        // When getting index information we don't know whether the field has
        // dots in the name or if it's a nested object / array field. To keep
        // the check simple we just stringify the detailed schema path for
        // comparison
        path.join('.')
      ) ||
        // Assuming that ObjectIds might point to some _id in a different
        // namespace
        schema.bsonType === 'objectId')
    ) {
      schemaPropertyPaths.push(path);
    }
  });
  const maybeRelationships = schemaPropertyPaths.flatMap((path) => {
    const sampleValues = sampleDocs.flatMap((doc) => {
      return getValuesFromPath(doc, path);
    });
    return collections.map(({ ns }) => {
      return {
        foreignNamespace: ns,
        localPropertyPath: path,
        sampleValues,
      };
    });
  });
  const relationships = await Promise.all(
    maybeRelationships.map(
      async ({
        foreignNamespace,
        localPropertyPath,
        sampleValues,
      }): Promise<Relationship['relationship'] | null> => {
        if (foreignNamespace === namespace) {
          return null;
        }
        const [matchingDoc] = await dataService
          .find(
            foreignNamespace,
            { _id: { $in: sampleValues as any } },
            {
              limit: 1,
              maxTimeMS: 5_000,
            },
            { abortSignal }
          )
          .catch(() => {
            return [];
          });
        if (!matchingDoc) {
          return null;
        }
        return [
          { ns: namespace, fields: localPropertyPath, cardinality: 1 },
          { ns: foreignNamespace, fields: ['_id'], cardinality: 1 },
        ];
      }
    )
  );
  return relationships.filter(
    (value): value is Relationship['relationship'] => {
      return value !== null;
    }
  );
}
