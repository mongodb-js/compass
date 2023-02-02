import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';
import Papa from 'papaparse';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

import { createCollectionWriteStream } from '../utils/collection-stream';
import type { CollectionStreamStats } from '../utils/collection-stream';
import type { Delimiter, IncludedFields, PathPart } from '../utils/csv';
import { makeDoc, parseHeaderName } from '../utils/csv';
import { createDebug } from '../utils/logger';

const debug = createDebug('import-csv');

type ImportCSVOptions = {
  dataService: DataService;
  ns: string;
  input: Readable;
  abortSignal?: AbortSignal;
  progressCallback?: (index: number) => void;
  delimiter?: Delimiter;
  ignoreEmptyStrings?: boolean;
  stopOnErrors?: boolean;
  fields: IncludedFields; // the type chosen by the user to make each field
};

type ImportCSVResult = CollectionStreamStats & { aborted?: boolean };

export async function importCSV({
  dataService,
  ns,
  input,
  abortSignal,
  progressCallback,
  delimiter = ',',
  ignoreEmptyStrings,
  stopOnErrors,
  fields,
}: ImportCSVOptions): Promise<ImportCSVResult> {
  debug('importCSV()', { ns: toNS(ns) });

  let numProcessed = 0;
  const headerFields: string[] = []; // will be filled via transformHeader callback below
  let parsedHeader: Record<string, PathPart[]>;

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: Record<string, string>, encoding, callback) {
      if (!parsedHeader) {
        parsedHeader = {};
        for (const [index, name] of headerFields.entries()) {
          try {
            parsedHeader[name] = parseHeaderName(name);
          } catch (err: unknown) {
            // rethrow with the row and column indexes appended to aid debugging
            // TODO: this needs a test
            (err as Error).message = `${
              (err as Error).message
            }[Row 0][Col ${index}]`;
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
      progressCallback?.(numProcessed);

      debug('importCSV:transform', numProcessed, {
        headerFields,
        chunk,
        fields,
        ignoreEmptyStrings,
        encoding,
      });

      try {
        const doc = makeDoc(chunk, headerFields, parsedHeader, fields, {
          ignoreEmptyStrings,
        });
        debug('transform', doc);
        callback(null, doc);
      } catch (err: unknown) {
        // rethrow with the row index appended to aid debugging
        (err as Error).message = `${
          (err as Error).message
        }[Row ${numProcessed}]`;

        if (stopOnErrors) {
          callback(err as Error);
        } else {
          // TODO: keep the error somewhere
          debug('transform error', (err as Error).message);
          callback();
        }
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
    parseStream,
    docStream,
    collectionStream,
    ...(abortSignal ? [{ signal: abortSignal }] : []),
  ] as const;

  try {
    await pipeline(...params);
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      return {
        ...collectionStream.getStats(),
        aborted: true,
      };
    }
    throw err;
  }

  return collectionStream.getStats();
}
