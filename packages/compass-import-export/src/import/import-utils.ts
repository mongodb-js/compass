import os from 'os';
import type { Document } from 'bson';
import type { Readable, Writable, Duplex } from 'stream';
import { addAbortSignal } from 'stream';
import type { ImportResult, ErrorJSON, ImportOptions } from './import-types';
import { ImportWriter } from './import-writer';
import { createDebug } from '../utils/logger';
import { Utf8Validator } from '../utils/utf8-validator';
import { ByteCounter } from '../utils/byte-counter';
import stripBomStream from 'strip-bom-stream';

const debug = createDebug('import');

export function makeImportResult(
  importWriter: ImportWriter,
  numProcessed: number,
  numParseErrors: number,
  docStatsStream: DocStatsCollector,
  aborted?: boolean
): ImportResult {
  const result: ImportResult = {
    docsErrored: numParseErrors + importWriter.docsErrored,
    docsWritten: importWriter.docsWritten,
    ...docStatsStream.getStats(),
    // docsProcessed is not on importWriter so that it includes docs that
    // produced parse errors and therefore never made it that far
    docsProcessed: numProcessed,
  };

  if (aborted) {
    result.aborted = aborted;
  }

  return result;
}

export function errorToJSON(error: any): ErrorJSON {
  const obj: ErrorJSON = {
    name: error.name,
    message: error.message,
  };

  for (const key of ['index', 'code', 'op', 'errInfo'] as const) {
    if (error[key] !== undefined) {
      obj[key] = error[key];
    }
  }

  return obj;
}

export function writeErrorToLog(output: Writable, error: any): Promise<void> {
  return new Promise(function (resolve) {
    output.write(JSON.stringify(error) + os.EOL, 'utf8', (err: unknown) => {
      if (err) {
        debug('error while writing error', err);
      }
      // we always resolve because we ignore the error
      resolve();
    });
  });
}

function hasArrayOfLength(
  val: unknown,
  len = 250,
  seen = new WeakSet()
): boolean {
  if (Array.isArray(val)) {
    return val.length >= len;
  }
  if (typeof val === 'object' && val !== null) {
    if (seen.has(val)) {
      return false;
    }
    seen.add(val);
    for (const prop of Object.values(val)) {
      if (hasArrayOfLength(prop, len, seen)) {
        return true;
      }
    }
  }
  return false;
}

type DocStats = { biggestDocSize: number; hasUnboundArray: boolean };

export class DocStatsCollector {
  private stats: DocStats = { biggestDocSize: 0, hasUnboundArray: false };

  collect(doc: Document) {
    this.stats.hasUnboundArray =
      this.stats.hasUnboundArray || hasArrayOfLength(doc, 250);
    try {
      const docString = JSON.stringify(doc);
      this.stats.biggestDocSize = Math.max(
        this.stats.biggestDocSize,
        docString.length
      );
    } catch (error) {
      // We ignore the JSON stringification error
    }
  }

  getStats() {
    return this.stats;
  }
}

type Transformer = {
  transform: (chunk: any) => Document;
  lineAnnotation: (numProcessed: number) => string;
};

export async function doImport(
  input: Readable,
  streams: Duplex[],
  transformer: Transformer,
  {
    dataService,
    ns,
    output,
    abortSignal,
    progressCallback,
    errorCallback,
    stopOnErrors,
  }: ImportOptions
): Promise<ImportResult> {
  const byteCounter = new ByteCounter();

  let stream: Readable | Duplex;

  const docStatsCollector = new DocStatsCollector();

  const importWriter = new ImportWriter(dataService, ns, stopOnErrors);

  let numProcessed = 0;
  let numParseErrors = 0;

  // Stream errors just get thrown synchronously unless we listen for the event
  // on each stream we use in the pipeline. By destroying the stream we're
  // iterating on and passing the error, the "for await line" will throw inside
  // the try/catch below. Relevant test: "errors if a file is truncated utf8"
  function streamErrorListener(error: Error) {
    stream.destroy(error);
  }

  input.once('error', streamErrorListener);

  stream = input;

  const allStreams = [
    new Utf8Validator(),
    byteCounter,
    stripBomStream(),
    ...streams,
  ];

  for (const s of allStreams) {
    stream = stream.pipe(s);
    stream.once('error', streamErrorListener);
  }

  if (abortSignal) {
    stream = addAbortSignal(abortSignal, stream);
  }

  try {
    for await (const chunk of stream as Readable) {
      // Call progress and increase the number processed even if it errors
      // below. The import writer stats at the end stores how many got written.
      // This way progress updates continue even if every row fails to parse.
      ++numProcessed;
      if (!abortSignal?.aborted) {
        progressCallback?.({
          bytesProcessed: byteCounter.total,
          docsProcessed: numProcessed,
          docsWritten: importWriter.docsWritten,
        });
      }

      let doc: Document;
      try {
        doc = transformer.transform(chunk);
      } catch (err: unknown) {
        ++numParseErrors;
        // deal with transform error

        // rethrow with the line number / array index appended to aid debugging
        (err as Error).message = `${
          (err as Error).message
        }${transformer.lineAnnotation(numProcessed)}`;

        if (stopOnErrors) {
          throw err;
        } else {
          const transformedError = errorToJSON(err);
          debug('transform error', transformedError);
          errorCallback?.(transformedError);
          if (output) {
            await writeErrorToLog(output, transformedError);
          }
        }
        continue;
      }

      docStatsCollector.collect(doc);

      try {
        // write
        await importWriter.write(doc);
      } catch (err: any) {
        // if there is no writeErrors property, then it isn't an
        // ImportWriteError, so probably not recoverable
        if (!err.writeErrors) {
          throw err;
        }

        // deal with write error
        debug('write error', err);

        if (stopOnErrors) {
          throw err;
        }

        if (!output) {
          continue;
        }

        const errors = err.writeErrors;
        for (const error of errors) {
          const transformedError = errorToJSON(error);
          errorCallback?.(transformedError);
          await writeErrorToLog(output, transformedError);
        }
      }
    }

    input.removeListener('error', streamErrorListener);
    for (const s of allStreams) {
      s.removeListener('error', streamErrorListener);
    }

    // also insert the remaining partial batch
    try {
      await importWriter.finish();
    } catch (err: any) {
      // if there is no writeErrors property, then it isn't an
      // ImportWriteError, so probably not recoverable
      if (!err.writeErrors) {
        throw err;
      }

      // deal with write error
      debug('write error', err);

      if (stopOnErrors) {
        throw err;
      }

      if (output) {
        const errors = err.writeErrors;
        for (const error of errors) {
          const transformedError = errorToJSON(error);
          errorCallback?.(transformedError);
          await writeErrorToLog(output, transformedError);
        }
      }
    }
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      debug('import:aborting');

      const result = makeImportResult(
        importWriter,
        numProcessed,
        numParseErrors,
        docStatsCollector,
        true
      );
      debug('import:aborted', result);
      return result;
    }

    // stick the result onto the error so that we can tell how far it got
    err.result = makeImportResult(
      importWriter,
      numProcessed,
      numParseErrors,
      docStatsCollector
    );

    throw err;
  }

  debug('import:completing');

  const result = makeImportResult(
    importWriter,
    numProcessed,
    numParseErrors,
    docStatsCollector
  );
  debug('import:completed', result);

  return result;
}
