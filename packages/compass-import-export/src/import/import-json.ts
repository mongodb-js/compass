import { EJSON } from 'bson';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { Readable, Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import Parser from 'stream-json/Parser';
import StreamArray from 'stream-json/streamers/StreamArray';
import StreamValues from 'stream-json/streamers/StreamValues';
import stripBomStream from 'strip-bom-stream';

import { processParseError, processWriteStreamErrors } from '../utils/import';
import type { ErrorJSON } from '../utils/import';
import { createCollectionWriteStream } from '../utils/collection-stream';
import type { CollectionStreamStats } from '../utils/collection-stream';
import { createDebug } from '../utils/logger';

const debug = createDebug('import-json');

type JSONVariant = 'json' | 'jsonl';

type ImportJSONOptions = {
  dataService: DataService;
  ns: string;
  input: Readable;
  output: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: (index: number) => void;
  errorCallback?: (error: ErrorJSON) => void;
  stopOnErrors?: boolean;
  jsonVariant: JSONVariant;
};

type ImportJSONResult = CollectionStreamStats & { aborted?: boolean };

export async function importJSON({
  dataService,
  ns,
  input,
  output,
  abortSignal,
  progressCallback,
  errorCallback,
  stopOnErrors,
  jsonVariant,
}: ImportJSONOptions): Promise<ImportJSONResult> {
  debug('importJSON()', { ns: toNS(ns) });
  let numProcessed = 0;

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: any, encoding, callback) {
      ++numProcessed;
      progressCallback?.(numProcessed);
      try {
        // make sure files parsed as jsonl only contain objects with no arrays and simple values
        // (this will either stop the entire import and throw or just skip this
        // one value depending on the value of stopOnErrors)
        if (Object.prototype.toString.call(chunk.value) !== '[object Object]') {
          throw new Error('Value is not an object');
        }

        const doc = EJSON.deserialize(chunk.value);
        debug('transform', doc);
        callback(null, doc);
      } catch (err: unknown) {
        processParseError({
          annotation: ` [Index ${numProcessed - 1}]`,
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

  const parserStreams = [];
  if (jsonVariant === 'jsonl') {
    parserStreams.push(
      Parser.parser({ jsonStreaming: true }),
      StreamValues.streamValues()
    );
  } else {
    parserStreams.push(Parser.parser(), StreamArray.streamArray());
  }

  try {
    await pipeline(
      [input, stripBomStream(), ...parserStreams, docStream, collectionStream],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      await processWriteStreamErrors({
        collectionStream,
        output,
        errorCallback,
      });
      return {
        ...collectionStream.getStats(),
        aborted: true,
      };
    }
    throw err;
  }

  await processWriteStreamErrors({
    collectionStream,
    output,
    errorCallback,
  });

  return collectionStream.getStats();
}
