/* eslint-disable no-console */
import { Writable } from 'stream';
import { createDebug } from './logger';
import { promisify } from 'util';

const debug = createDebug('collection-stream');

function mongodbServerErrorToJSError({ index, code, errmsg, op, errInfo }) {
  const e = new Error(errmsg);
  e.index = index;
  e.code = code;
  e.op = op;
  e.errInfo = errInfo;
  // https://docs.mongodb.com/manual/reference/method/BulkWriteResult/#BulkWriteResult.writeErrors
  e.name = index && op ? 'WriteError' : 'WriteConcernError';
  return e;
}

class WritableCollectionStream extends Writable {
  constructor(dataService, ns, stopOnErrors) {
    super({ objectMode: true });
    this.dataService = dataService;
    this.ns = ns;
    this.BATCH_SIZE = 1000;
    this.docsWritten = 0;
    this.docsProcessed = 0;
    this.stopOnErrors = stopOnErrors;

    this.batch = [];
    this._batchCounter = 0;

    this._stats = {
      ok: 0,
      nInserted: 0,
      nMatched: 0,
      nModified: 0,
      nRemoved: 0,
      nUpserted: 0,
      writeErrors: [],
      writeConcernErrors: [],
    };

    this._errors = [];
  }

  _collection() {
    return this.dataService._collection(this.ns, 'CRUD');
  }

  _write(document, _encoding, next) {
    this.batch.push(document);

    if (this.batch.length === this.BATCH_SIZE) {
      return this._executeBatch(next);
    }

    next();
  }

  _final(callback) {
    debug('running _final()');

    if (this.batch.length === 0) {
      debug('%d docs written', this.docsWritten);
      this.printJobStats();
      return callback();
    }

    debug('draining buffered docs', this.batch.length);

    this._executeBatch(callback);
  }

  async _executeBatch(callback) {
    const documents = this.batch;

    this.batch = [];

    const bulkWrite = promisify(
      this._collection().bulkWrite.bind(this._collection())
    );
    let result;
    let error;

    try {
      result = await bulkWrite(
        documents.map((doc) => ({ insertOne: doc })),
        {
          ordered: this.stopOnErrors,
          retryWrites: false,
          checkKeys: false,
        }
      );
    } catch (bulkWriteError) {
      // Currently, the server does not support batched inserts for FLE2:
      // https://jira.mongodb.org/browse/SERVER-66315
      // We check for this specific error and re-try inserting documents one by one.
      if (bulkWriteError.code === 6371202) {
        const insertOne = promisify(
          this._collection().insertOne.bind(this._collection())
        );

        try {
          let nInserted = 0;
          await Promise.allSettled(
            documents.map(async (doc) => {
              try {
                await insertOne(doc, {});
                nInserted += 1;
              } catch (error) {
                this._errors.push(error);
              }
            })
          );
          result = { ok: 1, nInserted };
        } catch (insertOneByOneError) {
          error = insertOneByOneError;
        }
      } else {
        // If we are writing with `ordered: false`, bulkWrite will throw and
        // will not return any result, but server might write some docs and bulk
        // result can still be accessed on the error instance
        result = bulkWriteError.result && bulkWriteError.result.result;
        this._errors.push(bulkWriteError);
      }
    }

    // Driver seems to return null instead of undefined in some rare cases
    // when the operation ends in error, instead of relying on
    // `_mergeBulkOpResult` default argument substitution, we need to keep
    // this OR expression here
    this._mergeBulkOpResult(result);

    this.docsWritten = this._stats.nInserted;
    this.docsProcessed += documents.length;
    this._batchCounter++;

    this.printJobStats();

    this.emit('progress', {
      docsWritten: this.docsWritten,
      docsProcessed: this.docsProcessed,
      errors: this._errors
        .concat(this._stats.writeErrors)
        .concat(this._stats.writeConcernErrors),
    });

    if (this.stopOnErrors) {
      return callback(error);
    }

    return callback();
  }

  _mergeBulkOpResult(result = {}) {
    const numKeys = [
      'nInserted',
      'nMatched',
      'nModified',
      'nRemoved',
      'nUpserted',
      // Even though it's a boolean, treating it as num might allow us to see
      // how many batches finished "correctly" if `stopOnErrors` is `false` if
      // we ever need that
      'ok',
    ];

    numKeys.forEach((key) => {
      this._stats[key] += result[key] || 0;
    });

    this._stats.writeErrors.push(
      ...(result.writeErrors || []).map(mongodbServerErrorToJSError)
    );

    this._stats.writeConcernErrors.push(
      ...(result.writeConcernErrors || []).map(mongodbServerErrorToJSError)
    );
  }

  printJobStats() {
    console.group('Import Info');
    console.table(this._stats);
    console.log('Errors Seen');
    console.log(
      this._errors
        .concat(this._stats.writeErrors)
        .concat(this._stats.writeConcernErrors)
    );
    console.groupEnd();
  }
}

export const createCollectionWriteStream = function (
  dataService,
  ns,
  stopOnErrors
) {
  return new WritableCollectionStream(dataService, ns, stopOnErrors);
};

export const createReadableCollectionStream = function (
  dataService,
  ns,
  spec = { filter: {} },
  projection = {}
) {
  const { limit, skip } = spec;

  return dataService
    .fetch(ns, spec.filter || {}, {
      projection,
      limit,
      skip,
    })
    .stream();
};
