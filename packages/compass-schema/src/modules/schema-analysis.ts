import { isInternalFieldPath } from 'hadron-document';
import type { AggregateOptions, Filter, Document } from 'mongodb';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import type { DataService } from 'mongodb-data-service';
import mongodbSchema from 'mongodb-schema';

const { log, mongoLogId, debug } = createLoggerAndTelemetry('COMPASS-SCHEMA');

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

export const analyzeSchema = async (
  dataService: Pick<DataService, 'sample' | 'isCancelError'>,
  abortSignal: AbortSignal,
  ns: string,
  query:
    | {
        query?: Filter<Document>;
        size?: number;
        fields?: Document;
      }
    | undefined,
  aggregateOptions: AggregateOptions
) => {
  try {
    log.info(mongoLogId(1001000089), 'Schema', 'Starting schema analysis', {
      ns,
    });

    const docs = await dataService.sample(
      ns,
      query,
      {
        ...aggregateOptions,
        promoteValues: false,
      },
      {
        abortSignal,
      }
    );
    const schemaData = await mongodbSchema(docs);
    schemaData.fields = schemaData.fields.filter(
      ({ path }) => !isInternalFieldPath(path)
    );
    log.info(mongoLogId(1001000090), 'Schema', 'Schema analysis completed', {
      ns,
    });
    return schemaData;
  } catch (err: any) {
    log.error(mongoLogId(1001000091), 'Schema', 'Schema analysis failed', {
      ns,
      error: err.message,
    });
    if (dataService.isCancelError(err)) {
      debug('caught background operation terminated error', err);
      return null;
    }

    const error = promoteMongoErrorCode(err);

    debug('schema analysis failed', err);
    throw error;
  }
};
