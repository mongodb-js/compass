import util from 'util';
import { isInternalFieldPath } from 'hadron-document';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { log, mongoLogId, debug } = createLoggerAndTelemetry('COMPASS-SCHEMA');

import mongodbSchema from 'mongodb-schema';
const analyzeDocuments = util.promisify(mongodbSchema);

// hack for driver 3.6 not promoting error codes and
// attributes from ejson when promoteValue is false.
function promoteMongoErrorCode(err) {
  if (!err) {
    return new Error('Unknown error');
  }

  if (err.name === 'MongoError' && err.code !== undefined) {
    err.code = JSON.parse(JSON.stringify(err.code));
  }

  return err;
}

export const analyzeSchema = async (
  dataService,
  abortSignal,
  ns,
  query,
  aggregateOptions
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
    const schemaData = await analyzeDocuments(docs);
    schemaData.fields = schemaData.fields.filter(
      ({ path }) => !isInternalFieldPath(path)
    );
    log.info(mongoLogId(1001000090), 'Schema', 'Schema analysis completed', {
      ns,
    });
    return schemaData;
  } catch (err) {
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
