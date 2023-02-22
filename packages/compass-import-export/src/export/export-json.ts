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
import type { SchemaPath } from './gather-fields';

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
  fields?: SchemaPath[];
};

type ExportJSONResult = {
  docsWritten: number;
  aborted: boolean;
};

function getEJSONOptionsForVariant(
  variant: 'default' | 'relaxed' | 'canonical'
) {
  return variant === 'relaxed'
    ? {
        relaxed: true,
      }
    : variant === 'canonical'
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
}: // fields,
ExportJSONOptions): Promise<ExportJSONResult> {
  debug('exportJSON()', { ns: toNS(ns) });

  let docsWritten = 0;

  const ejsonOptions = getEJSONOptionsForVariant(variant);

  if (!abortSignal.aborted) {
    output.write('[');
  }

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: any, encoding, callback) {
      ++docsWritten; // TODO: is numProcessed not number written.
      progressCallback?.(docsWritten);
      try {
        const doc = `${
          (docsWritten > 1 ? ',\n' : '') +
          EJSON.stringify(chunk, ejsonOptions, 2)
        }`;

        debug('transform', doc);
        callback(null, doc);
      } catch (err: unknown) {
        // TODO
      }
    },
    final: function (callback) {
      this.push(']');
      callback(null);
    },
  });

  // todo: promoteValues ?
  const collectionCursor = createReadableCollectionCursor({
    dataService,
    ns,
    query,
    aggregation,
    // TODO: projection + fields
  });
  const collectionStream = collectionCursor.stream();

  const params = [
    collectionStream,
    docStream,
    output,
    ...(abortSignal ? [{ signal: abortSignal }] : []),
  ] as const;

  try {
    await pipeline(...params);

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
