import util from 'util';
import { isInternalFieldPath } from 'hadron-document';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { log, mongoLogId, debug } = createLoggerAndTelemetry('COMPASS-SCHEMA');

import mongodbSchema from 'mongodb-schema';
const analyzeDocuments = util.promisify(mongodbSchema);

const ERROR_CODE_INTERRUPTED = 11601;
const ERROR_CODE_CURSOR_NOT_FOUND = 43;

function isOperationTerminatedError(err) {
  return (
    err.name === 'MongoError' &&
    (err.code === ERROR_CODE_INTERRUPTED ||
      err.code === ERROR_CODE_CURSOR_NOT_FOUND)
  );
}

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

class SchemaAnalysis {
  constructor(dataService, ns, query, driverOptions) {
    this._ns = ns;
    this._dataService = dataService;
    this._cursor = dataService.sample(ns, query, {
      ...driverOptions,
      promoteValues: false,
    });

    this._cancelled = new Promise((resolve) => {
      this._cancelGetResult = () => resolve(null);
    });
  }

  getResult() {
    if (!this._result) {
      this._result = Promise.race([this._cancelled, this._sampleAndAnalyze()]);
    }

    return this._result;
  }

  terminate() {
    this._cancelGetResult();
    this._close();
  }

  async _sampleAndAnalyze() {
    try {
      log.info(mongoLogId(1001000089), 'Schema', 'Starting schema analysis', {
        ns: this._ns,
      });
      const docs = await this._cursor
        .toArray()
        .catch((err) => Promise.reject(promoteMongoErrorCode(err)));
      const schemaData = await analyzeDocuments(docs);
      schemaData.fields = schemaData.fields.filter(({ path }) => !isInternalFieldPath(path));
      log.info(mongoLogId(1001000090), 'Schema', 'Schema analysis completed', {
        ns: this._ns,
      });
      return schemaData;
    } catch (err) {
      log.error(mongoLogId(1001000091), 'Schema', 'Schema analysis failed', {
        ns: this._ns,
        error: err.message,
      });
      if (isOperationTerminatedError(err)) {
        debug('caught background operation terminated error', err);
        return null;
      }

      debug('schema analysis failed', err);
      throw err;
    } finally {
      this._close();
    }
  }

  async _close() {
    if (this._closed) {
      return;
    }

    this._closed = true;

    try {
      await this._cursor.close();
      debug('background operation terminated');
    } catch (err) {
      debug('error while terminating background operation', err);
    }
  }
}

export default function createSchemaAnalysis(
  dataService,
  ns,
  query,
  driverOptions
) {
  return new SchemaAnalysis(dataService, ns, query, driverOptions);
}
