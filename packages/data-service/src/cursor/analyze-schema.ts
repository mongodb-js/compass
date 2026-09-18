import {
  analyzeDocuments,
  type Schema,
  type SchemaParseOptions,
} from '@mongodb-js/mongodb-schema';
import type { AggregateOptions, Document, Filter } from 'mongodb';
import type { DataService } from '../data-service';

/**
 * Arguments for `DataService#analyzeSchema`. `query` selects the sample (size /
 * optional pre-filter / fields), `aggregateOptions` configures the underlying
 * `$sample`/aggregate, and `signal` can abort the analysis.
 */
export type AnalyzeSchemaArgs = {
  ns: string;
  query?:
    | {
        query?: Filter<Document>;
        size?: number;
        fields?: Document;
      }
    | undefined;
  aggregateOptions: AggregateOptions;
  signal?: AbortSignal;
};

// hack for driver 3.6 not promoting error codes and
// attributes from ejson when promoteValue is false.
function promoteMongoErrorCode(err?: Error & { code?: unknown }) {
  if (!err) {
    return new Error('Unknown error');
  }

  if (err.name === 'MongoError' && err.code !== undefined) {
    err.code = JSON.parse(JSON.stringify(err.code));
  }

  return err;
}

/**
 * Runs the sampled cursor through mongodb-schema's analyzer and resolves with
 * the schema — or `undefined` if the analysis was aborted (matching the
 * previous schema-analysis behavior of swallowing abort without a throw).
 */
export async function analyzeSchema(
  dataService: Pick<DataService, 'sampleCursor'>,
  { ns, query, aggregateOptions, signal }: AnalyzeSchemaArgs
): Promise<Schema | undefined> {
  const sampleCursor = dataService.sampleCursor(
    ns,
    query,
    {
      ...aggregateOptions,
      promoteValues: false,
      signal,
    },
    {
      fallbackReadPreference: 'secondaryPreferred',
    }
  );

  const schemaParseOptions: SchemaParseOptions = {
    signal,
    storedValuesLengthLimit: 100,
  };

  try {
    // Resolve with the schema DATA, not the SchemaAccessor (whose methods /
    // internal object graph can't cross the structured-clone boundary).
    const accessor = await analyzeDocuments(sampleCursor, schemaParseOptions);
    return await accessor.getInternalSchema();
  } catch (err: unknown) {
    if (signal?.aborted) {
      // The operation was aborted; don't throw.
      return undefined;
    }
    throw promoteMongoErrorCode(err as Error & { code?: unknown });
  }
}
