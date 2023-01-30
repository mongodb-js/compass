import { Transform, pipeline } from 'stream';
import type { Readable } from 'stream';
import Papa from 'papaparse';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

import type { CSVFieldType } from './analyze-csv-fields';
import { createCollectionWriteStream } from '../utils/collection-stream';
import type { CollectionStreamStats } from  '../utils/collection-stream';
import type { Delimiter } from '../utils/constants';
import { createDebug } from '../utils/logger';

const debug = createDebug('import-csv');

type ImportCSVOptions = {
  dataService: DataService;
  ns: string;
  input: Readable;
  abortSignal: AbortSignal;
  progressCallback: (index: number) => void;
  delimiter: Delimiter;
  ignoreEmptyStrings?: boolean;
  stopOnErrors?: boolean;
  fields: Record<string, CSVFieldType>; // the type chosen by the user to make each field
};

export function importCSV({
  dataService,
  ns,
  input,
  abortSignal,
  progressCallback,
  delimiter,
  ignoreEmptyStrings,
  stopOnErrors,
  fields,
}: ImportCSVOptions): Promise<CollectionStreamStats> {
  debug('importCSV()', { ns: toNS(ns) });

  let numProcessed = 0;
  const headerFields: string[] = []; // will be filled via transformHeader callback below

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk, encoding, callback) {
      ++numProcessed;
      debug('importCSV:transform', numProcessed, { headerFields, chunk, fields, ignoreEmptyStrings, encoding });
      const doc = {}; // TODO
      if (abortSignal.aborted) {
        docStream.destroy();
      }
      progressCallback(numProcessed);
      callback(null, doc)
    }
  });

  const collectionStream = createCollectionWriteStream(
    dataService,
    ns,
    stopOnErrors ?? false
  );

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
    delimiter,
    header: true,
    dynamicTyping: true,
    transformHeader: function(header: string, index: number): string {
      debug('importCSV:transformHeader', header, index);
      headerFields.push(header);
      return header;
    },
  });

  return new Promise((resolve, reject) => {
    pipeline(
      input,
      parseStream,
      docStream,
      collectionStream,
      function (err) {
        if (err) {
          reject(err);
        }

        resolve(collectionStream.getStats());
      });
  });
}
