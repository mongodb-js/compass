import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { Document } from 'bson';
import { isEqual } from 'lodash';
import type { MongoDBJSONSchema } from 'mongodb-schema';
import type { Relationship } from '../services/data-model-storage';

/**
 * A very simplistic depth-first traversing function that only handles a subset
 * of real JSON schema keywords that is applicable to our MongoDB JSON schema
 * format.
 *
 * Types are unwrapped: every bson type is treated as its own item to visit.
 *
 * Array items will have the same path as the array itself, mimicking how the
 * paths would look like in mongodb query.
 *
 * @internal exported only for testing purposes
 */
export function* traverseMongoDBJSONSchema(
  schema: MongoDBJSONSchema,
  path: string[] = [],
  isArrayItem = false
): Iterable<{
  schema: MongoDBJSONSchema;
  path: string[];
  isArrayItem: boolean;
}> {
  if (schema.anyOf) {
    for (const s of schema.anyOf) {
      yield* traverseMongoDBJSONSchema(s, path);
    }
    return;
  }

  if (Array.isArray(schema.bsonType)) {
    for (const t of schema.bsonType) {
      yield* traverseMongoDBJSONSchema({ ...schema, bsonType: t }, path);
    }
    return;
  }

  yield { schema, path, isArrayItem };

  if (schema.items) {
    for (const s of Array.isArray(schema.items)
      ? schema.items
      : [schema.items]) {
      yield* traverseMongoDBJSONSchema(s, path, true);
    }
    return;
  }

  if (schema.properties) {
    for (const [key, s] of Object.entries(schema.properties)) {
      yield* traverseMongoDBJSONSchema(s, [...path, key]);
    }
  }
}

/**
 * @internal exported only for testing purposes
 */
export function findPropertyPathsMatchingSchema(
  schema: MongoDBJSONSchema,
  schemaToMatch: MongoDBJSONSchema
): string[][] {
  const properties: string[][] = [];
  for (const { schema: s, path } of traverseMongoDBJSONSchema(schema)) {
    if (s.bsonType === schemaToMatch.bsonType && isEqual(s, schemaToMatch)) {
      properties.push(path);
    }
  }
  return properties;
}

/**
 * @internal exported only for testing purposes
 */
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

/**
 * A function that is given a starting collection and a list of other
 * collections in the database returns a list of identified relationships in the
 * database using the following algorighm:
 *
 * For a collection (assumed foreign)
 *   - If collection doesn’t have an index on _id field, return
 *   - For each collection (assumed local)
 *       > If collection name equals the foreign collection name, continue to
 *         the next collection
 *       > For every field in local collection
 *           + If field type matches foreign collection _id type
 *               * Pick sample values for the field from provided samples
 *               * Run a count against foreign collection querying by sample
 *                 values for _id field
 *               * If the returned count equals the amount of sample values,
 *                 return relationship
 *
 * @param foreignNamespace collection that is assumed "foreign" in the
 * relationship
 * @param foreignSchema schema of the "foreign" collection
 * @param _sampleDocs
 * @param collections list of all collections that will be checked for matching
 * relationships
 * @param dataService dataService instance
 * @param abortSignal signal to cancel the inferring process
 * @param onError callback that will be called if inference fails with an error
 * @returns a list of confirmed relationships
 */
export async function inferForeignToLocalRelationshipsForCollection(
  foreignNamespace: string,
  foreignSchema: MongoDBJSONSchema,
  _sampleDocs: Document[],
  collections: { ns: string; schema: MongoDBJSONSchema; sample: Document[] }[],
  dataService: DataService,
  abortSignal?: AbortSignal,
  onError?: (err: any) => void
): Promise<Relationship['relationship'][]> {
  const idSchema = foreignSchema.properties?._id;
  if (!idSchema) {
    return [];
  }
  const indexes = await dataService
    .indexes(foreignNamespace, { full: false })
    .catch(() => {
      // If this fails for any reason, assume there are no indexes. DataService
      // will log the error, so we are not logging it here
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
              .filter((doc) => {
                // remove missing values from the data sample
                return doc !== undefined && doc !== null;
              })
              // in case sample data is an array that contains a lot of values,
              // we limit the amount of samples to reduce the matching time
              .slice(0, 100);
            if (sampleDocs.length === 0) {
              return null;
            }
            const matchingDocCount = await dataService.count(
              foreignNamespace,
              {
                _id: {
                  $in: sampleDocs as any[], // driver wants this to be an ObjectId unless a generic type for the filter is provided, we don't currently support passing this generic value on data service level
                },
              },
              { hint: { _id: 1 }, maxTimeMS: 10_000 },
              { abortSignal, fallbackReadPreference: 'secondaryPreferred' }
            );
            if (matchingDocCount !== sampleDocs.length) {
              return null;
            }
            return [
              { ns: localColl.ns, fields: propPath, cardinality: 1 },
              { ns: foreignNamespace, fields: ['_id'], cardinality: 1 },
            ] as const;
          } catch (err) {
            onError?.(err);
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
