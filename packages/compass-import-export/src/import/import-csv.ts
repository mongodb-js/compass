import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { Readable, Writable } from 'stream';
import Papa from 'papaparse';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import stripBomStream from 'strip-bom-stream';

import { createCollectionWriteStream } from '../utils/collection-stream';
import { makeDoc, parseHeaderName } from '../utils/csv';
import {
  makeImportResult,
  processParseError,
  processWriteStreamErrors,
} from '../utils/import';
import type { Delimiter, IncludedFields, PathPart } from '../utils/csv';
import type { ImportResult, ErrorJSON, ImportProgress } from '../utils/import';
import { createDebug } from '../utils/logger';
import { Utf8Validator } from '../utils/utf8-validator';
import { ByteCounter } from '../utils/byte-counter';

const debug = createDebug('import-csv');

type ImportCSVOptions = {
  dataService: DataService;
  ns: string;
  input: Readable;
  output?: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: (progress: ImportProgress) => void;
  errorCallback?: (error: ErrorJSON) => void;
  delimiter?: Delimiter;
  ignoreEmptyStrings?: boolean;
  stopOnErrors?: boolean;
  fields: IncludedFields; // the type chosen by the user to make each field
};

export async function importCSV({
  dataService,
  ns,
  input,
  output,
  abortSignal,
  progressCallback,
  errorCallback,
  delimiter = ',',
  ignoreEmptyStrings,
  stopOnErrors,
  fields,
}: ImportCSVOptions): Promise<ImportResult> {
  debug('importCSV()', { ns: toNS(ns) });

  const byteCounter = new ByteCounter();

  let numProcessed = 0;
  const headerFields: string[] = []; // will be filled via transformHeader callback below
  let parsedHeader: Record<string, PathPart[]>;

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: Record<string, string>, encoding, callback) {
      if (!parsedHeader) {
        // There's a quirk in papaparse where it calls transformHeader()
        // before it finishes auto-detecting the line endings. We could pass
        // in a line ending that we previously detected (in guessFileType(),
        // perhaps?) or we can just strip the extra \r from the final header
        // name if it exists.
        if (headerFields.length) {
          const lastName = headerFields[headerFields.length - 1];
          headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
        }

        parsedHeader = {};
        for (const [index, name] of headerFields.entries()) {
          try {
            parsedHeader[name] = parseHeaderName(name);
          } catch (err: unknown) {
            // rethrow with the row and column indexes appended to aid debugging
            (err as Error).message = `${
              (err as Error).message
            } [Col ${index}][Row 0]`;
            debug('parseHeaderName error', (err as Error).message);

            // If this fails, the whole file will stop processing regardless of
            // the value of stopOnErrors because it is not recoverable if we
            // can't make sense of the header row.
            return callback(err as Error);
          }
        }
      }

      // Call progress and increase the number processed even if it errors
      // below. The collection write stream stats at the end stores how many
      // got written. This way progress updates continue even if every row
      // fails to parse.
      ++numProcessed;
      progressCallback?.({
        bytesProcessed: byteCounter.total,
        docsProcessed: numProcessed,
        docsWritten: collectionStream.docsWritten,
      });

      try {
        const doc = makeDoc(chunk, headerFields, parsedHeader, fields, {
          ignoreEmptyStrings,
        });
        callback(null, doc);
      } catch (err: unknown) {
        processParseError({
          annotation: `[Row ${numProcessed}]`,
          stopOnErrors,
          err,
          output,
          errorCallback,
          callback,
        });
      }
    },
  });

  const collectionStream = createCollectionWriteStream(
    dataService,
    ns,
    stopOnErrors ?? false
  );

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
    delimiter,
    header: true,
    transformHeader: function (header: string, index: number): string {
      debug('importCSV:transformHeader', header, index);
      headerFields.push(header);
      return header;
    },
  });

  const params = [
    input,
    new Utf8Validator(),
    byteCounter,
    stripBomStream(),
    parseStream,
    docStream,
    collectionStream,
    ...(abortSignal ? [{ signal: abortSignal }] : []),
  ] as const;

  try {
    await pipeline(...params);
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      await processWriteStreamErrors({
        collectionStream,
        output,
        errorCallback,
      });

      return makeImportResult(collectionStream, numProcessed, true);
    }

    // stick the result onto the error so that we can tell how far it got
    err.result = makeImportResult(collectionStream, numProcessed);

    throw err;
  }

  await processWriteStreamErrors({
    collectionStream,
    output,
    errorCallback,
  });

  return makeImportResult(collectionStream, numProcessed);
}
