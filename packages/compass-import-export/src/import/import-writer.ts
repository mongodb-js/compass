/* eslint-disable no-console */
import type {
  Document,
  MongoBulkWriteError,
  AnyBulkWriteOperation,
  WriteError,
  BulkWriteResult,
  MongoServerError,
} from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import type { ErrorJSON } from '../import/import-types';

import { createDebug } from '../utils/logger';

const debug = createDebug('import-writer');

type PartialBulkWriteResult = Partial<
  Pick<BulkWriteResult, 'insertedCount' | 'getWriteErrors'>
>;

type BulkOpResult = {
  insertedCount: number;
  numWriteErrors: number;
};

class ImportWriterError extends Error {
  writeErrors: any[];
  name = 'ImportWriterError';

  constructor(writeErrors: any[]) {
    super('Something went wrong while writing data to a collection');
    this.writeErrors = writeErrors;
  }
}

type ImportWriterProgressError = Error & {
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
}: Pick<MongoServerError, 'code' | 'errInfo'> &
  Partial<
    Pick<MongoServerError, 'index' | 'errmsg' | 'op'>
  >): ImportWriterProgressError {
  const e: ImportWriterProgressError = new Error(errmsg) as any;
  e.index = index;
  e.code = code;
  e.op = op;
  e.errInfo = errInfo;
  // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
  e.name = index && op ? 'WriteError' : 'WriteConcernError';
  return e;
}

export class ImportWriter {
  dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>;
  ns: string;
  BATCH_SIZE: number;
  docsWritten: number;
  docsProcessed: number;
  docsErrored: number;
  stopOnErrors?: boolean;
  batch: Document[];
  _batchCounter: number;
  errorCallback?: (error: ErrorJSON) => void;

  constructor(
    dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>,
    ns: string,
    stopOnErrors?: boolean
  ) {
    this.dataService = dataService;
    this.ns = ns;
    this.BATCH_SIZE = 1000;
    this.docsWritten = 0;
    this.docsProcessed = 0;
    this.docsErrored = 0;
    this.stopOnErrors = stopOnErrors;

    this.batch = [];
    this._batchCounter = 0;
  }

  async write(document: Document) {
    this.batch.push(document);

    if (this.batch.length >= this.BATCH_SIZE) {
      await this._executeBatch();
    }
  }

  async finish() {
    if (this.batch.length === 0) {
      debug('%d docs written', this.docsWritten);
      return;
    }

    debug('draining buffered docs', this.batch.length);

    await this._executeBatch();
  }

  async _executeBatch() {
    const documents = this.batch;

    this.batch = [];

    let bulkWriteResult: PartialBulkWriteResult;
    try {
      bulkWriteResult = await this.dataService.bulkWrite(
        this.ns,
        documents.map(
          (document: any): AnyBulkWriteOperation<Document> => ({
            insertOne: { document },
          })
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

        bulkWriteResult = await this._insertOneByOne();
      } else {
        // If we are writing with `ordered: false`, bulkWrite will throw and
        // will not return any result, but server might write some docs and bulk
        // result can still be accessed on the error instance

        // Driver seems to return null instead of undefined in some rare cases
        // when the operation ends in error, instead of relying on
        // `_mergeBulkOpResult` default argument substitution, we need to keep
        // this OR expression here
        bulkWriteResult = (bulkWriteError as MongoBulkWriteError).result || {};
      }
    }

    const bulkOpResult = this._getBulkOpResult(bulkWriteResult);

    const writeErrors = (bulkWriteResult?.getWriteErrors?.() || []).map(
      mongodbServerErrorToJSError
    );

    this.docsWritten += bulkOpResult.insertedCount;
    this.docsProcessed += documents.length;
    this.docsErrored += bulkOpResult.numWriteErrors;
    this._batchCounter++;

    if (writeErrors.length) {
      throw new ImportWriterError(writeErrors);
    }
  }

  async _insertOneByOne(): Promise<PartialBulkWriteResult> {
    const documents = this.batch;

    let insertedCount = 0;
    const errors: WriteError[] = [];

    for (const doc of documents) {
      try {
        await this.dataService.insertOne(this.ns, doc);
        insertedCount += 1;
      } catch (insertOneByOneError: any) {
        errors.push(insertOneByOneError as WriteError);
        this.docsErrored += 1;

        if (this.stopOnErrors) {
          break;
        }
      }
    }

    return {
      insertedCount,
      getWriteErrors: () => {
        return errors;
      },
    };
  }

  _getBulkOpResult(result: PartialBulkWriteResult): BulkOpResult {
    const writeErrors = result.getWriteErrors?.() || [];

    return {
      insertedCount: result.insertedCount || 0,
      numWriteErrors: writeErrors.length,
    };
  }
}
