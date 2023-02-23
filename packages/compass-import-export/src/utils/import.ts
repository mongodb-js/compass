import os from 'os';
import type { Writable } from 'stream';
import type {
  CollectionStreamStats,
  CollectionStreamProgressError,
  WritableCollectionStream,
} from '../utils/collection-stream';
import { createDebug } from './logger';

const debug = createDebug('import');

export type ImportResult = {
  aborted?: boolean;
  dbErrors: CollectionStreamProgressError[];
  dbStats: CollectionStreamStats;
  docsWritten: number;
  docsProcessed: number;
};

export function makeImportResult(
  collectionStream: WritableCollectionStream,
  numProcessed: number,
  aborted?: boolean
): ImportResult {
  const result: ImportResult = {
    dbErrors: collectionStream.getErrors(),
    dbStats: collectionStream.getStats(),
    docsWritten: collectionStream.docsWritten,
    // docsProcessed is not on collectionStream so that it includes docs that
    // produced parse errors and therefore never made it to the collection
    // stream.
    docsProcessed: numProcessed,
  };

  if (aborted) {
    result.aborted = aborted;
  }

  return result;
}

export type ErrorJSON = {
  name: string;
  message: string;
  index?: number;
  code?: string | number;
  op?: any;
  errorInfo?: Document;
  /*
  e.index = index;
  e.code = code;
  e.op = op;
  e.errInfo = errInfo;
  // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
  e.name = index && op ? 'WriteError' : 'WriteConcernError';
*/
};

export function errorToJSON(error: any): ErrorJSON {
  const obj: ErrorJSON = {
    name: error.name,
    message: error.message,
  };

  for (const key of ['index', 'code', 'op', 'errorInfo'] as const) {
    if (error[key] !== undefined) {
      obj[key] = error[key];
    }
  }

  return obj;
}

export type ImportProgress = {
  bytesProcessed: number;
  docsProcessed: number;
  docsWritten: number;
};

export async function processWriteStreamErrors({
  collectionStream,
  output,
  errorCallback,
}: {
  collectionStream: WritableCollectionStream;
  output?: Writable;
  errorCallback?: (err: ErrorJSON) => void;
}) {
  // This is temporary until we change WritableCollectionStream so it can pipe
  // us its errors as they occur.

  const errors = collectionStream.getErrors();
  const stats = collectionStream.getStats();
  const allErrors = errors
    .concat(stats.writeErrors)
    .concat(stats.writeConcernErrors);

  for (const error of allErrors) {
    const transformedError = errorToJSON(error);
    debug('write error', transformedError);
    errorCallback?.(transformedError);

    if (!output) {
      continue;
    }

    try {
      await new Promise<void>((resolve) => {
        output.write(JSON.stringify(transformedError) + os.EOL, 'utf8', () =>
          resolve()
        );
      });
    } catch (err: any) {
      debug('error while writing error', err);
    }
  }
}

export function processParseError({
  annotation,
  stopOnErrors,
  err,
  output,
  errorCallback,
  callback,
}: {
  annotation: string;
  stopOnErrors?: boolean;
  err: unknown;
  output?: Writable;
  errorCallback?: (error: ErrorJSON) => void;
  callback: (err?: any) => void;
}) {
  // rethrow with the line number / array index appended to aid debugging
  (err as Error).message = `${(err as Error).message}${annotation}`;

  if (stopOnErrors) {
    callback(err as Error);
  } else {
    const transformedError = errorToJSON(err);
    debug('transform error', transformedError);
    errorCallback?.(transformedError);
    if (output) {
      output.write(
        JSON.stringify(transformedError) + os.EOL,
        'utf8',
        (err: any) => {
          if (err) {
            debug('error while writing error', err);
          }
          callback();
        }
      );
    } else {
      callback();
    }
  }
}
