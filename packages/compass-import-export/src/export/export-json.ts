import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { EJSON } from 'bson';
import type { Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

import { createReadableCollectionCursor } from '../utils/collection-stream';
import type {
  ExportQuery,
  ExportAggregation,
} from '../utils/collection-stream';
import { createDebug } from '../utils/logger';

const debug = createDebug('export-json');

type ExportJSONOptions = {
  dataService: DataService;
  ns: string;
  output: Writable;
  abortSignal: AbortSignal;
  query?: ExportQuery;
  aggregation?: ExportAggregation;
  progressCallback: (index: number) => void;
  variant: 'default' | 'relaxed' | 'canonical';
};

type ExportJSONResult = {
  docsWritten: number;
  aborted: boolean;
};

function getEJSONOptionsForVariant(
  variant: 'default' | 'relaxed' | 'canonical'
) {
  if (variant === 'relaxed') {
    return {
      relaxed: true,
    };
  }
  return variant === 'canonical'
    ? {
        relaxed: false, // canonical
      }
    : undefined; // default
}

export async function exportJSON({
  dataService,
  ns,
  output,
  abortSignal,
  query = { filter: {} },
  progressCallback,
  aggregation,
  variant,
}: ExportJSONOptions): Promise<ExportJSONResult> {
  debug('exportJSON()', { ns: toNS(ns) });

  let docsWritten = 0;

  const ejsonOptions = getEJSONOptionsForVariant(variant);

  if (!abortSignal.aborted) {
    output.write('[');
  }

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: any, encoding, callback) {
      // NOTE: This count is used as the final documents written count,
      // however it does not, at this point, represent the count of documents
      // written to the file as this is an earlier point in the pipeline.
      ++docsWritten;
      progressCallback?.(docsWritten);
      try {
        const doc = `${
          (docsWritten > 1 ? ',\n' : '') +
          EJSON.stringify(chunk, ejsonOptions, 2)
        }`;

        debug('transform', doc);
        callback(null, doc);
      } catch (err: any) {
        callback(err);
      }
    },
    final: function (callback) {
      this.push(']');
      callback(null);
    },
  });

  const collectionCursor = createReadableCollectionCursor({
    dataService,
    ns,
    query,
    aggregation,
  });
  const collectionStream = collectionCursor.stream();

  try {
    await pipeline(
      [collectionStream, docStream, output],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );

    if (abortSignal.aborted) {
      void collectionCursor.close();
    } else {
      output.write(']\n', 'utf8');
    }
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      void collectionCursor.close();
      return {
        docsWritten,
        aborted: true,
      };
    }

    throw err;
  }

  return {
    docsWritten,
    aborted: abortSignal.aborted,
  };
}
