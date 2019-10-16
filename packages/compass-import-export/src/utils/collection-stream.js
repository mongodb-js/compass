/* eslint-disable no-console */
import { Writable } from 'stream';
import { createLogger } from './logger';
const debug = createLogger('collection-stream');

class WritableCollectionStream extends Writable {
  constructor(dataService, ns, stopOnErrors) {
    super({ objectMode: true });
    this.dataService = dataService;
    this.ns = ns;
    this.BATCH_SIZE = 1000;
    this.docsWritten = 0; 
    this.stopOnErrors = stopOnErrors;

    this._initBatch();
    this._batchCounter = 0;
    this._stats = {
      nInserted: 0,
      nMatched: 0,
      nModified: 0,
      nRemoved: 0,
      nUpserted: 0,
      ok: 0,
      writeErrorCount: 0
    };

    this._errors = [];
  }

  _initBatch() {
    this.batch = this._collection().initializeUnorderedBulkOp({
      explicitlyIgnoreSession: true,
      retryWrites: false,
      writeConcern: {
        w: 0
      },
      // TODO: lucas: option in mongoimport w slightly different name?
      checkKeys: false
    });
  }

  _collection() {
    return this.dataService.client._collection(this.ns);
  }

  _write(chunk, encoding, next) {
    this.batch.insert(chunk);
    if (this.batch.length === this.BATCH_SIZE) {
      // TODO: lucas: expose finer-grained bulk op results:
      // https://mongodb.github.io/node-mongodb-native/3.3/api/BulkWriteResult.html
      const nextBatch = (err, res = {}) => {
        if (err && this.stopOnErrors) {
          return next(err);
        }
        this.docsWritten += this.batch.length;
        if (err) {
          debug(`batch ${this._batchCounter} result`, {err, res});
        }
        this.captureStatsForBulkResult(err, res);

        this._batchCounter++;
        this._initBatch();
        next();
      };

      const execBatch = cb => {
        const batchSize = this.batch.length;
        this.batch.execute(
          (err, res) => {
            // TODO: lucas: appears turning off retyableWrites
            // gives a slightly different error but probably same problem?
            if (err && Array.isArray(err.errorLabels) && err.errorLabels.indexOf('TransientTransactionError')) {
              debug('NOTE: @lucas: this is a transient transaction error and is a bug in retryable writes.', err);
              err = null;
              res = {nInserted: batchSize};
            }

            if (err && !this.stopOnErrors) {
              console.log('stopOnErrors false. skipping', err);
              err = null;
              // TODO: lucas: figure out how to extract finer-grained bulk op results
              // from err in these cases.
              res = {};
            }
            if (err) {
              this._errors.push(err);
              return cb(err);
            }
            cb(null, res);
          }
        );
      };
      execBatch(nextBatch);
      return;
    }
    next();
  }

  _final(callback) {
    debug('running _final()');

    if (this.batch.length === 0) {
      // debug('nothing left in buffer');
      debug('%d docs written', this.docsWritten);
      this.printJobStats();
      return callback();
    }

    // TODO: lucas: Reuse error wrangling from _write above.
    debug('draining buffered docs', this.batch.length);
    this.batch.execute((err, res) => {
      this.captureStatsForBulkResult(err, res);
      this.docsWritten += this.batch.length;
      this.printJobStats();
      this.batch = null;
      // debug('buffer drained', err, res);
      debug('%d docs written', this.docsWritten);
      callback(err);
    });
  }

  captureStatsForBulkResult(err, res) {
    const keys = [
      'nInserted',
      'nMatched',
      'nModified',
      'nRemoved',
      'nUpserted',
      'ok'
    ];

    keys.forEach(k => {
      this._stats[k] += res[k] || 0;
    });
    if (!err) return;

    if (err.name === 'BulkWriteError') {
      this._errors.push.apply(this._errors, err.result.result.writeErrors);
      this._errors.push.apply(
        this._errors,
        err.result.result.writeConcernErrors
      );
      this._stats.writeErrorCount += err.result.result.writeErrors.length;
    }
  }

  printJobStats() {
    console.group('Import Info');
    console.table(this._stats);
    console.log('Errors Seen');
    console.log(this._errors);
    console.groupEnd();
  }
}

export const createCollectionWriteStream = function(dataService, ns, stopOnErrors) {
  return new WritableCollectionStream(dataService, ns, stopOnErrors);
};

export const createReadableCollectionStream = function(
  dataService,
  ns,
  spec = { filter: {} }
) {
  const { project, limit, skip } = spec;
  return dataService
    .fetch(ns, spec.filter || {}, { explicitlyIgnoreSession: true, project, limit, skip })
    .stream();
};
