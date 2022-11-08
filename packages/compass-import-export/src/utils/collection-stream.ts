/* eslint-disable no-console */
import { Writable } from 'stream';
import type {
  MongoServerError,
  Document,
  MongoBulkWriteError,
  AnyBulkWriteOperation,
  WriteError,
  WriteConcernError,
  BulkWriteResult,
} from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import { promisify } from 'util';

import { createDebug } from './logger';

const debug = createDebug('collection-stream');

type CollectionStreamProgressError = Error | WriteError | WriteConcernError;

type WriteCollectionStreamProgressError = Error & {
  index: number;
  code: MongoServerError['code'];
  op: MongoServerError['op'];
  errInfo: MongoServerError['errInfo'];
};

function mongodbServerErrorToJSError({
  index,
  code,
  errmsg,
  op,
  errInfo,
}: MongoServerError): WriteCollectionStreamProgressError {
  const e: WriteCollectionStreamProgressError = new Error(errmsg) as any;
  e.index = index;
  e.code = code;
  e.op = op;
  e.errInfo = errInfo;
  // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
  e.name = index && op ? 'WriteError' : 'WriteConcernError';
  return e;
}

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
] as const;

type BulkOpResult = {
  [numkey in typeof numKeys[number]]?: number;
};

export type CollectionStreamProgress = {
  docsWritten: number;
  docsProcessed: number;
  errors: CollectionStreamProgressError[];
};

export class WritableCollectionStream extends Writable {
  dataService: DataService;
  ns: string;
  BATCH_SIZE: number;
  docsWritten: number;
  docsProcessed: number;
  stopOnErrors: boolean;
  batch: Document[];
  _batchCounter: number;
  _stats: {
    ok: number;
    nInserted: number;
    nMatched: number;
    nModified: number;
    nRemoved: number;
    nUpserted: number;
    writeErrors: WriteCollectionStreamProgressError[];
    writeConcernErrors: WriteCollectionStreamProgressError[];
  };
  _errors: CollectionStreamProgressError[];

  constructor(dataService: DataService, ns: string, stopOnErrors: boolean) {
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

  _write(
    document: Document,
    _encoding: BufferEncoding,
    next: (err?: Error) => void
  ) {
    this.batch.push(document);

    if (this.batch.length >= this.BATCH_SIZE) {
      return this._executeBatch(next);
    }

    next();
  }

  _final(callback: (err?: Error) => void) {
    debug('running _final()');

    if (this.batch.length === 0) {
      debug('%d docs written', this.docsWritten);
      this.printJobStats();
      return callback();
    }

    debug('draining buffered docs', this.batch.length);

    void this._executeBatch(callback);
  }

  async _executeBatch(callback: (err?: Error) => void) {
    const documents = this.batch;

    this.batch = [];

    let result: BulkOpResult;
    // TODO: How is this error used?
    let error;

    try {
      result = await this.dataService.bulkWrite(
        this.ns,
        // TODO: Why does this type error without any usage? Are we using an old insert format?
        documents.map(
          (doc: any): AnyBulkWriteOperation<Document> => ({ insertOne: doc })
        ),
        {
          ordered: this.stopOnErrors,
          retryWrites: false,
          checkKeys: false,
        }
      );
    } catch (bulkWriteError: any) {
      // Currently, the server does not support batched inserts for FLE2:
      // https://jira.mongodb.org/browse/SERVER-66315
      // We check for this specific error and re-try inserting documents one by one.
      if (bulkWriteError.code === 6371202) {
        this.BATCH_SIZE = 1;

        let nInserted = 0;

        for (const doc of documents) {
          try {
            await promisify(this.dataService.insertOne.bind(this.dataService))(
              this.ns,
              doc,
              {}
            );
            nInserted += 1;
          } catch (insertOneByOneError: any) {
            this._errors.push(insertOneByOneError as Error);

            if (this.stopOnErrors) {
              break;
            }
          }
        }

        result = { ok: 1, nInserted };
      } else {
        // If we are writing with `ordered: false`, bulkWrite will throw and
        // will not return any result, but server might write some docs and bulk
        // result can still be accessed on the error instance
        result =
          (bulkWriteError as MongoBulkWriteError).result &&
          (bulkWriteError as MongoBulkWriteError).result.result;
        this._errors.push(bulkWriteError);
      }
    }

    // Driver seems to return null instead of undefined in some rare cases
    // when the operation ends in error, instead of relying on
    // `_mergeBulkOpResult` default argument substitution, we need to keep
    // this OR expression here
    this._mergeBulkOpResult(result || {});

    this.docsWritten = this._stats.nInserted;
    this.docsProcessed += documents.length;
    this._batchCounter++;

    this.printJobStats();

    const progressStats: CollectionStreamProgress = {
      docsWritten: this.docsWritten,
      docsProcessed: this.docsProcessed,
      errors: this._errors
        .concat(this._stats.writeErrors)
        .concat(this._stats.writeConcernErrors),
    };

    this.emit('progress', progressStats);

    if (this.stopOnErrors) {
      return callback(error);
    }

    return callback();
  }

  _mergeBulkOpResult(result: BulkWriteResult | Record<string, number> = {}) {
    numKeys.forEach((key) => {
      this._stats[key] += result[key] || 0;
    });

    this._stats.writeErrors.push(
      ...((result as any).writeErrors || []).map(mongodbServerErrorToJSError)
    );

    this._stats.writeConcernErrors.push(
      ...((result as any).writeConcernErrors || []).map(
        mongodbServerErrorToJSError
      )
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
  dataService: DataService,
  ns: string,
  stopOnErrors: boolean
) {
  return new WritableCollectionStream(dataService, ns, stopOnErrors);
};

export const createReadableCollectionStream = function (
  dataService: DataService,
  ns: string,
  spec: {
    filter: Document;
    limit?: number;
    skip?: number;
  } = { filter: {} },
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
