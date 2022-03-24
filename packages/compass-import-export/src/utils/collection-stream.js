/* eslint-disable no-console */
import { Writable } from 'stream';
import { createDebug } from './logger';
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
    return this.dataService._collection(this.ns);
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

  _executeBatch(callback) {
    const documents = this.batch;

    this.batch = [];

    this._collection().bulkWrite(
      documents.map((doc) => ({ insertOne: doc })),
      {
        ordered: this.stopOnErrors,
        retryWrites: false,
        checkKeys: false,
      },
      (err, res) => {
        // If we are writing with `ordered: false`, bulkWrite will throw and
        // will not return any result, but server might write some docs and bulk
        // result can still be accessed on the error instance
        const result = (err && err.result && err.result.result) || res;

        // Driver seems to return null instead of undefined in some rare cases
        // when the operation ends in error, instead of relying on
        // `_mergeBulkOpResult` default argument substitution, we need to keep
        // this OR expression here
        this._mergeBulkOpResult(result || {});

        this.docsProcessed += documents.length;

        this.docsWritten = this._stats.nInserted;

        this._batchCounter++;

        if (err) {
          this._errors.push(err);
        }

        this.printJobStats();

        this.emit('progress', {
          docsWritten: this.docsWritten,
          docsProcessed: this.docsProcessed,
          errors: this._errors
            .concat(this._stats.writeErrors)
            .concat(this._stats.writeConcernErrors),
        });

        if (this.stopOnErrors) {
          return callback(err);
        }

        return callback();
      }
    );
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
