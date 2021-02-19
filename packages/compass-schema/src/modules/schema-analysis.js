import util from 'util';

import createDebug from 'debug';
const debug = createDebug('mongodb-compass:stores:schema-analysis');

import mongodbSchema from 'mongodb-schema';
const analyzeDocuments = util.promisify(mongodbSchema);

const ERROR_CODE_INTERRUPTED = 11601;
const ERROR_CODE_CURSOR_NOT_FOUND = 43;

function isOperationTerminatedError(err) {
  return err.name === 'MongoError' && (
    err.code === ERROR_CODE_INTERRUPTED ||
    err.code === ERROR_CODE_CURSOR_NOT_FOUND
  );
}

class SchemaAnalysis {
  constructor(dataService, ns, query, driverOptions) {
    this._dataService = dataService;
    this._cursor = dataService.sample(
      ns,
      query,
      {...driverOptions, promoteValues: false}
    );

    this._cancelled = new Promise((resolve) => {
      this._cancelGetResult = () => resolve(null);
    });
  }

  getResult() {
    if (!this._result) {
      this._result = Promise.race([
        this._cancelled,
        this._sampleAndAnalyze()
      ]);
    }

    return this._result;
  }

  terminate() {
    this._cancelGetResult();
    this._close();
  }

  async _sampleAndAnalyze() {
    try {
      const docs = await this._cursor.toArray();
      return await analyzeDocuments(docs);
    } catch (err) {
      if (isOperationTerminatedError(err)) {
        debug('catched background operation terminated error', err);
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

export default function createSchemaAnalysis(dataService, ns, query, driverOptions) {
  return new SchemaAnalysis(dataService, ns, query, driverOptions);
}
