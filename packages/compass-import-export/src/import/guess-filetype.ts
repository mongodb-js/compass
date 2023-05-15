import { PassThrough, Transform } from 'stream';
import type { Readable } from 'stream';
import util from 'util';
import Papa from 'papaparse';
import StreamJSON from 'stream-json';

import { createDebug } from '../utils/logger';
import { supportedDelimiters } from '../csv/csv-types';
import type { Delimiter, Linebreak } from '../csv/csv-types';

const debug = createDebug('import-guess-filetype');

function detectJSON(input: Readable): Promise<'json' | 'jsonl' | null> {
  return new Promise(function (resolve) {
    const parser = StreamJSON.parser();

    let found = false;

    parser.once('data', (data) => {
      debug('detectJSON:data', data);

      let jsonVariant: 'json' | 'jsonl' | null = null;
      if (data.name === 'startObject') {
        jsonVariant = 'jsonl';
      } else if (data.name === 'startArray') {
        jsonVariant = 'json';
      }

      found = true;
      input.destroy();
      resolve(jsonVariant);
    });

    parser.on('end', () => {
      debug('detectJSON:end');
      if (!found) {
        found = true;
        // reached the end before a full doc
        input.destroy();
        resolve(null);
      }
    });

    parser.on('close', (err: Error) => {
      debug('detectJSON:close', err);
      if (!found) {
        found = true;
        // stream closed before a full doc
        input.destroy();
        resolve(null);
      }
    });

    parser.on('error', (err: Error) => {
      debug('detectJSON:error', err);
      if (!found) {
        found = true;
        // got an error before a full doc
        input.destroy();
        resolve(null);
      }
    });

    input.pipe(parser);
  });
}

function hasDelimiterError({
  data,
  errors,
}: {
  data: string[];
  errors: { code?: string }[];
}) {
  // papaparse gets weird when there's only one header field. It might find a
  // space in the second line and go with that. So rather go with our own
  // delimiter detection code in this case.
  if (data.length < 2) {
    return true;
  }
  return (
    errors.find((error) => error.code === 'UndetectableDelimiter') !== undefined
  );
}

function redetectDelimiter({ data }: { data: string[] }): Delimiter {
  for (const char of data[0]) {
    if ((supportedDelimiters as unknown as string[]).includes(char)) {
      return char as Delimiter;
    }
  }

  return ',';
}

function detectCSV(
  input: Readable,
  jsonPromise: Promise<'json' | 'jsonl' | null>
): Promise<Delimiter | null> {
  let csvDelimiter: Delimiter | null = null;
  let lines = 0;
  let found = false;

  // stop processing CSV as soon as we detect JSON
  const jsonDetected = new Promise<null>(function (resolve) {
    jsonPromise
      .then((jsonType) => {
        if (jsonType) {
          input.destroy();
          resolve(null);
        }
      })
      .catch(() => {
        // if the file was not valid JSON, then ignore this because either CSV
        // detection will eventually succeed FileSizeEnforcer will error
      });
  });

  return Promise.race([
    jsonDetected,
    new Promise<Delimiter | null>(function (resolve) {
      Papa.parse(input, {
        // NOTE: parsing without header: true otherwise the delimiter detection
        // can't fail and will always detect ,
        delimitersToGuess: supportedDelimiters as unknown as string[],
        step: function (results: Papa.ParseStepResult<string[]>) {
          ++lines;
          debug('detectCSV:step', lines, results);
          if (lines === 1) {
            if (hasDelimiterError(results)) {
              csvDelimiter = redetectDelimiter(results);
            } else {
              csvDelimiter = results.meta.delimiter as Delimiter;
            }
          }
          // must be at least two lines for header row and data
          if (lines === 2) {
            found = true;
            debug('detectCSV:complete');
            input.destroy();
            resolve(lines === 2 ? csvDelimiter : null);
          }
        },
        complete: function () {
          debug('detectCSV:complete');
          if (!found) {
            found = true;
            // we reached the end before two lines
            input.destroy();
            resolve(null);
          }
        },
        error: function (err) {
          debug('detectCSV:error', err);
          if (!found) {
            found = true;
            // something failed before we got to the end of two lines
            input.destroy();
            resolve(null);
          }
        },
      });
    }),
  ]);
}

type GuessFileTypeOptions = {
  input: Readable;
};

type GuessFileTypeResult =
  | {
      type: 'json' | 'jsonl' | 'unknown';
    }
  | {
      type: 'csv';
      csvDelimiter: Delimiter;
      newline: Linebreak;
    };

const MAX_LENGTH = 1000000;

class FileSizeEnforcer extends Transform {
  length = 0;

  _transform(
    chunk: Buffer,
    enc: unknown,
    cb: (err: null | Error, chunk?: Buffer) => void
  ) {
    this.length += chunk.length;
    if (this.length > MAX_LENGTH) {
      cb(new Error(`CSV still not detected after ${MAX_LENGTH} bytes`));
    } else {
      cb(null, chunk);
    }
  }
}

class NewlineDetector extends Transform {
  chunks: string[] = [];
  decoder = new util.TextDecoder('utf8', { fatal: true, ignoreBOM: true });

  _transform(
    chunk: Buffer,
    enc: unknown,
    cb: (err: null | Error, chunk?: Buffer) => void
  ) {
    try {
      /*
      It might look like this is going to store the entire file in memory, but
      this whole process will stop the moment it detects either JSON (which
      happens nearly immediately if that's the case) or when it detects CSV
      (which happens as soon as we hit two lines). If it doesn't detect either
      of those, then FileSizeEnforcer will kick in, we'll find Unknown and the
      process also stops.

      But just in case someone thinks this is generic enough to use in any
      situation, we're not exporting this class so it will only be used here.
      */
      this.chunks.push(this.decoder.decode(chunk, { stream: true }));
    } catch (err: any) {
      cb(err);
      return;
    }
    cb(null, chunk);
  }

  _flush(cb: (err: null | Error, chunk?: Buffer) => void) {
    try {
      this.chunks.push(this.decoder.decode(new Uint8Array()));
    } catch (err: any) {
      cb(err);
      return;
    }
    cb(null);
  }

  detectNewline(): Linebreak {
    const text = this.chunks.join('');
    const firstRN = text.indexOf('\r\n');
    const firstN = text.indexOf('\n');

    if (firstRN !== -1 && firstRN < firstN) {
      // If there is a \r\n then there most be a \n , so firstN is never -1. But
      // there might have been a \n even earlier.
      return '\r\n';
    }

    // Either there is only a \n in which case we go with that, or there are no
    // line endings in which case we just go with a default of \n as it won't
    // matter because there are no lines to split anyway.
    return '\n';
  }
}

export function guessFileType({
  input,
}: GuessFileTypeOptions): Promise<GuessFileTypeResult> {
  return new Promise<GuessFileTypeResult>((resolve, reject) => {
    void (async () => {
      const newlineDetector = new NewlineDetector();
      input = input.pipe(newlineDetector);

      input.once('error', function (err) {
        reject(err);
      });

      const jsStream = input.pipe(new PassThrough());
      const csvStream = input
        .pipe(new PassThrough())
        .pipe(new FileSizeEnforcer());

      const jsonPromise = detectJSON(jsStream);

      const [jsonVariant, csvDelimiter] = await Promise.all([
        jsonPromise,
        detectCSV(csvStream, jsonPromise),
      ]);

      // keep streaming until both promises resolved, then destroy the input
      // stream to stop further processing
      input.destroy();

      debug('guessFileType', jsonVariant, csvDelimiter);

      // check JSON first because practically anything will parse as CSV
      if (jsonVariant) {
        resolve({ type: jsonVariant });
        return;
      }

      if (csvDelimiter) {
        const newline = newlineDetector.detectNewline();
        resolve({ type: 'csv', csvDelimiter, newline });
        return;
      }

      resolve({ type: 'unknown' });
    })();
  });
}
