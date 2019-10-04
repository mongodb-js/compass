import { Writable } from 'stream';
import { createLogger } from './logger';
const debug = createLogger('collection-stream');

class WritableCollectionStream extends Writable {
  constructor(dataService, ns) {
    super({ objectMode: true });
    this.dataService = dataService;
    this.ns = ns;
    this.BATCH_SIZE = 1000;
    this.docsWritten = 0;
    this.batch = this._collection().initializeOrderedBulkOp();
  }

  _collection() {
    return this.dataService.client._collection(this.ns);
  }

  _write(chunk, encoding, next) {
    this.batch.insert(chunk);
    if (this.batch.length === this.BATCH_SIZE) {
      /**
       * TODO: lucas: expose finer-grained bulk op results:
       * https://mongodb.github.io/node-mongodb-native/3.3/api/BulkWriteResult.html
       */
      return this.batch.execute((err, res) => {
        this.docsWritten += this.batch.length;
        this.batch = this._collection().initializeOrderedBulkOp();
        if (err) {
          debug('error', err);
          return next(err);
        }
        debug('batch result', res);
        next();
      });
    }
    next();
  }

  _final(callback) {
    debug('running _final()');
    if (this.batch.length === 0) {
      debug('nothing left in buffer');
      debug('%d docs written', this.docsWritten);
      return callback();
    }
    debug('draining buffered docs', this.batch.length);
    this.batch.execute((err, res) => {
      this.docsWritten += this.batch.length;
      this.batch = null;
      debug('buffer drained', err, res);
      debug('%d docs written', this.docsWritten);
      callback(err);
    });
  }
}

export const createCollectionWriteStream = function(dataService, ns) {
  return new WritableCollectionStream(dataService, ns);
};

export const createReadableCollectionStream = function(
  dataService,
  ns,
  spec = { filter: {} }
) {
  const { project, limit, skip } = spec;
  return dataService
    .fetch(ns, spec.filter || {}, { project, limit, skip })
    .stream();
};
