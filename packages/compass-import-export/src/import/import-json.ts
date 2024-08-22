import { EJSON } from 'bson';
import type { Readable } from 'stream';
import toNS from 'mongodb-ns';
import Parser from 'stream-json/Parser';
import StreamArray from 'stream-json/streamers/StreamArray';
import StreamValues from 'stream-json/streamers/StreamValues';

import { doImport } from './import-utils';
import type { ImportOptions, ImportResult } from './import-types';
import { createDebug } from '../utils/logger';

const debug = createDebug('import-json');

type JSONVariant = 'json' | 'jsonl';

type ImportJSONOptions = ImportOptions & {
  input: Readable;
  jsonVariant: JSONVariant;
};

class JSONTransformer {
  transform(chunk: any) {
    // make sure files parsed as jsonl only contain objects with no arrays and simple values
    // (this will either stop the entire import and throw or just skip this
    // one value depending on the value of stopOnErrors)
    if (Object.prototype.toString.call(chunk.value) !== '[object Object]') {
      throw new Error('Value is not an object');
    }

    return EJSON.deserialize(chunk.value as Document, {
      relaxed: false,
    });
  }
}

export async function importJSON({
  dataService,
  ns,
  output,
  abortSignal,
  progressCallback,
  errorCallback,
  stopOnErrors,
  input,
  jsonVariant,
}: ImportJSONOptions): Promise<ImportResult> {
  debug('importJSON()', { ns: toNS(ns) });

  if (ns === 'test.compass-import-abort-e2e-test') {
    // Give the test more than enough time to click the abort before we continue.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const transformer = new JSONTransformer();

  const streams = [];

  if (jsonVariant === 'jsonl') {
    streams.push(Parser.parser({ jsonStreaming: true }));
    streams.push(StreamValues.streamValues());
  } else {
    streams.push(Parser.parser());
    streams.push(StreamArray.streamArray());
  }

  return doImport(input, streams, transformer, {
    dataService,
    ns,
    output,
    abortSignal,
    progressCallback,
    errorCallback,
    stopOnErrors,
  });
}
