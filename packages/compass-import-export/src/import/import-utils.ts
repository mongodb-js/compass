import os from 'os';
import { Transform } from 'stream';
import type { Writable } from 'stream';

import type { ImportResult, ErrorJSON } from './import-types';

import type { WritableCollectionStream } from '../utils/collection-stream';

import { createDebug } from '../utils/logger';

const debug = createDebug('import');

export function makeImportResult(
  collectionStream: WritableCollectionStream,
  numProcessed: number,
  docStatsStream: DocStatsStream,
  aborted?: boolean
): ImportResult {
  const result: ImportResult = {
    dbErrors: collectionStream.getErrors(),
    dbStats: collectionStream.getStats(),
    docsWritten: collectionStream.docsWritten,
    ...docStatsStream.getStats(),
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

function hasArrayOfLength(
  val: unknown,
  len = 250,
  seen = new WeakSet()
): boolean {
  if (Array.isArray(val)) {
    return val.length >= len;
  }
  if (typeof val === 'object' && val !== null) {
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    for (const prop of Object.values(val)) {
      if (hasArrayOfLength(prop, len, seen)) {
        return true;
      }
    }
  }
  return false;
}

type DocStats = { biggestDocSize: number; hasUnboundArray: boolean };

export class DocStatsStream extends Transform {
  private stats: DocStats = { biggestDocSize: 0, hasUnboundArray: false };

  constructor() {
    super({
      objectMode: true,
      transform: (doc, encoding, callback) => {
        this.stats.hasUnboundArray =
          this.stats.hasUnboundArray || hasArrayOfLength(doc, 250);
        try {
          const docString = JSON.stringify(doc);
          this.stats.biggestDocSize = Math.max(
            this.stats.biggestDocSize,
            docString.length
          );
        } catch (error) {
          // We ignore the JSON stringification error
        } finally {
          callback(null, doc);
        }
      },
    });
  }

  getStats(): Readonly<DocStats> {
    return this.stats;
  }
}
