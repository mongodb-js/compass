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

import {
  DocStatsStream,
  makeImportResult,
  processParseError,
  processWriteStreamErrors,
} from './import-utils';
import type { ImportResult, ErrorJSON, ImportProgress } from './import-types';
import { createCollectionWriteStream } from '../utils/collection-stream';
import { createDebug } from '../utils/logger';
import { Utf8Validator } from '../utils/utf8-validator';
import { ByteCounter } from '../utils/byte-counter';

const debug = createDebug('import-json');

type JSONVariant = 'json' | 'jsonl';

type ImportJSONOptions = {
  dataService: Pick<DataService, 'bulkWrite' | 'insertOne'>;
  ns: string;
  input: Readable;
  output?: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: (progress: ImportProgress) => void;
  errorCallback?: (error: ErrorJSON) => void;
  stopOnErrors?: boolean;
  jsonVariant: JSONVariant;
};

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
}: ImportJSONOptions): Promise<ImportResult> {
  debug('importJSON()', { ns: toNS(ns) });

  const byteCounter = new ByteCounter();

  let numProcessed = 0;

  if (ns === 'test.compass-import-abort-e2e-test') {
    // Give the test more than enough time to click the abort before we continue.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: any, encoding, callback) {
      ++numProcessed;
      if (!abortSignal?.aborted) {
        progressCallback?.({
          bytesProcessed: byteCounter.total,
          docsProcessed: numProcessed,
          docsWritten: collectionStream.docsWritten,
        });
      }
      try {
        // make sure files parsed as jsonl only contain objects with no arrays and simple values
        // (this will either stop the entire import and throw or just skip this
        // one value depending on the value of stopOnErrors)
        if (Object.prototype.toString.call(chunk.value) !== '[object Object]') {
          throw new Error('Value is not an object');
        }

        const doc = EJSON.deserialize(chunk.value as Document, {
          relaxed: false,
        });
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

  const docStatsStream = new DocStatsStream();

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
      [
        input,
        new Utf8Validator(),
        byteCounter,
        stripBomStream(),
        ...parserStreams,
        docStream,
        docStatsStream,
        collectionStream,
      ],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      await processWriteStreamErrors({
        collectionStream,
        output,
        errorCallback,
      });

      return makeImportResult(
        collectionStream,
        numProcessed,
        docStatsStream,
        true
      );
    }

    // stick the result onto the error so that we can tell how far it got
    err.result = makeImportResult(
      collectionStream,
      numProcessed,
      docStatsStream
    );

    throw err;
  }

  await processWriteStreamErrors({
    collectionStream,
    output,
    errorCallback,
  });

  return makeImportResult(collectionStream, numProcessed, docStatsStream);
}
