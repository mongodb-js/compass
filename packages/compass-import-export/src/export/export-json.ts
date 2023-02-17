import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { EJSON } from 'bson';
import type { Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import type { TypeCastMap } from 'hadron-type-checker';

import { createReadableCollectionStream } from '../utils/collection-stream';
import { createDebug } from '../utils/logger';
import type { SchemaPath } from './gather-fields';

type BSONObject = TypeCastMap['Object'];

const debug = createDebug('export-json');

type ExportQuery = {
  filter: BSONObject;
  limit?: number;
  skip?: number;
  projection?: BSONObject;
};

type ExportJSONOptions = {
  dataService: DataService;
  ns: string;
  output: Writable;
  abortSignal: AbortSignal;
  query?: ExportQuery;
  aggregation?: BSONObject[];
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
  fields,
}: ExportJSONOptions): Promise<ExportJSONResult> {
  debug('exportJSON()', { ns: toNS(ns) });

  await new Promise((resolve) => setTimeout(resolve, 100));

  let docsWritten = 0;

  const ejsonOptions = getEJSONOptionsForVariant(variant);

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: any, encoding, callback) {
      ++docsWritten; // TODO: is numProcessed not number written.
      progressCallback?.(docsWritten);
      try {
        const doc = EJSON.stringify(chunk.value, ejsonOptions);
        // TODO: maybe doc should be different. JSON.parse

        debug('transform', doc);
        callback(null, doc);
      } catch (err: unknown) {
        // TODO
      }
    },
  });

  // TODO: pass abort signal here also
  // Should we make this function into two that then use this with a passed in readable?
  // promoteValues ?
  const collectionStream = createReadableCollectionStream({
    dataService,
    ns,
    query,
    aggregation,
    // TODO: projection + fields
  });

  const params = [
    collectionStream,
    docStream,
    output,
    ...(abortSignal ? [{ signal: abortSignal }] : []),
  ] as const;

  try {
    await pipeline(...params);
  } catch (err: any) {
    //  || dataService.isCancelError(err) or?

    if (err.code === 'ABORT_ERR') {
      return {
        docsWritten,
        aborted: true,
      };
    }

    // TODO? any error catch here?

    throw err;
  }

  return {
    docsWritten,
    aborted: abortSignal.aborted,
  };
}
