import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { Readable, Writable } from 'stream';
import Papa from 'papaparse';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import stripBomStream from 'strip-bom-stream';

import { createCollectionWriteStream } from '../utils/collection-stream';
import { makeDocFromCSV, parseCSVHeaderName } from '../csv/csv-utils';
import {
  DocStatsStream,
  makeImportResult,
  processParseError,
  processWriteStreamErrors,
} from './import-utils';
import type {
  Delimiter,
  Linebreak,
  IncludedFields,
  PathPart,
} from '../csv/csv-types';
import type { ImportResult, ErrorJSON, ImportProgress } from './import-types';
import { createDebug } from '../utils/logger';
import { Utf8Validator } from '../utils/utf8-validator';
import { ByteCounter } from '../utils/byte-counter';

const debug = createDebug('import-csv');

type ImportCSVOptions = {
  dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>;
  ns: string;
  input: Readable;
  output?: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: (progress: ImportProgress) => void;
  errorCallback?: (error: ErrorJSON) => void;
  delimiter?: Delimiter;
  newline: Linebreak;
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
  newline,
  ignoreEmptyStrings,
  stopOnErrors,
  fields,
}: ImportCSVOptions): Promise<ImportResult> {
  debug('importCSV()', { ns: toNS(ns), stopOnErrors });

  const byteCounter = new ByteCounter();

  let numProcessed = 0;
  const headerFields: string[] = []; // will be filled via transformHeader callback below
  let parsedHeader: Record<string, PathPart[]>;

  if (ns === 'test.compass-import-abort-e2e-test') {
    // Give the test more than enough time to click the abort before we continue.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

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
          const fixupFrom = headerFields[headerFields.length - 1];
          const fixupTo = fixupFrom.replace(/\r$/, '');
          headerFields[headerFields.length - 1] = fixupTo;
        }

        parsedHeader = {};
        for (const name of headerFields) {
          parsedHeader[name] = parseCSVHeaderName(name);
        }

        // TODO(COMPASS-7158): make sure array indexes start at 0 and have no
        // gaps, otherwise clean them up (ie. treat those parts as part of the
        // field name). So that you can't have a foo[1000000]
        // edge case.
      }

      // Call progress and increase the number processed even if it errors
      // below. The collection write stream stats at the end stores how many
      // got written. This way progress updates continue even if every row
      // fails to parse.
      ++numProcessed;
      if (!abortSignal?.aborted) {
        progressCallback?.({
          bytesProcessed: byteCounter.total,
          docsProcessed: numProcessed,
          docsWritten: collectionStream.docsWritten,
        });
      }

      try {
        const doc = makeDocFromCSV(chunk, headerFields, parsedHeader, fields, {
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

  const docStatsStream = new DocStatsStream();

  const collectionStream = createCollectionWriteStream(
    dataService,
    ns,
    stopOnErrors ?? false
  );

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
    delimiter,
    newline,
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
    docStatsStream,
    collectionStream,
    ...(abortSignal ? [{ signal: abortSignal }] : []),
  ] as const;

  try {
    await pipeline(...params);
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      debug('importCSV:aborting');

      await processWriteStreamErrors({
        collectionStream,
        output,
        errorCallback,
      });

      const result = makeImportResult(
        collectionStream,
        numProcessed,
        docStatsStream,
        true
      );
      debug('importCSV:aborted', result);
      return result;
    }

    // stick the result onto the error so that we can tell how far it got
    err.result = makeImportResult(
      collectionStream,
      numProcessed,
      docStatsStream
    );

    throw err;
  }

  debug('importCSV:completing');

  await processWriteStreamErrors({
    collectionStream,
    output,
    errorCallback,
  });

  const result = makeImportResult(
    collectionStream,
    numProcessed,
    docStatsStream
  );
  debug('importCSV:completed', result);
  return result;
}
