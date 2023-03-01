import { PassThrough } from 'stream';
import type { Readable } from 'stream';
import Papa from 'papaparse';
import StreamJSON from 'stream-json';

import { createDebug } from '../utils/logger';
import { supportedDelimiters } from '../utils/csv';
import type { Delimiter } from '../utils/csv';
import { Utf8Validator } from '../utils/utf8-validator';

const debug = createDebug('import-guess-filetype');

function detectJSON(input: Readable): Promise<'json' | 'jsonl' | null> {
  let jsonVariant: 'json' | 'jsonl' | null = null;

  return new Promise(function (resolve) {
    const parser = StreamJSON.parser();

    parser.once('data', (data) => {
      debug('detectJSON:data', data);
      if (data.name === 'startObject') {
        jsonVariant = 'jsonl';
      } else if (data.name === 'startArray') {
        jsonVariant = 'json';
      }
      parser.destroy();
    });

    parser.on('end', () => {
      debug('detectJSON:end', jsonVariant);
      resolve(jsonVariant);
    });

    parser.on('close', (err: Error) => {
      debug('detectJSON:close', err, jsonVariant);
      resolve(jsonVariant);
    });

    parser.on('error', (err: Error) => {
      debug('detectJSON:error', err);
      resolve(null);
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

function redetectDelimiter({ data }: { data: string[] }): string {
  for (const char of data[0]) {
    if (supportedDelimiters.includes(char)) {
      return char;
    }
  }

  return ',';
}

function detectCSV(input: Readable): Promise<Delimiter | null> {
  let csvDelimiter: Delimiter | null = null;
  let lines = 0;

  return new Promise(function (resolve) {
    Papa.parse(input, {
      // NOTE: parsing without header: true otherwise the delimiter detection
      // can't fail and will always detect ,
      delimitersToGuess: supportedDelimiters,
      step: function (results: Papa.ParseStepResult<string[]>, parser) {
        ++lines;
        debug('detectCSV:step', lines, results);
        if (lines === 1) {
          if (hasDelimiterError(results)) {
            csvDelimiter = redetectDelimiter(results);
          } else {
            csvDelimiter = results.meta.delimiter;
          }
        }
        // must be at least two lines for header row and data
        if (lines === 2) {
          parser.abort();
        }
      },
      complete: function () {
        debug('detectCSV:complete');
        resolve(lines === 2 ? csvDelimiter : null);
      },
      error: function () {
        debug('detectCSV:error');
        resolve(null);
      },
    });
  });
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
    };

export function guessFileType({
  input,
}: GuessFileTypeOptions): Promise<GuessFileTypeResult> {
  return new Promise<GuessFileTypeResult>((resolve, reject) => {
    void (async () => {
      input = input.pipe(new Utf8Validator());

      input.once('error', function (err) {
        reject(err);
      });

      const jsStream = input.pipe(new PassThrough());
      const csvStream = input.pipe(new PassThrough());

      const [jsonVariant, csvDelimiter] = await Promise.all([
        detectJSON(jsStream),
        detectCSV(csvStream),
      ]);

      debug('guessFileType', jsonVariant, csvDelimiter);

      // check JSON first because practically anything will parse as CSV
      if (jsonVariant) {
        resolve({ type: jsonVariant });
        return;
      }

      if (csvDelimiter) {
        resolve({ type: 'csv', csvDelimiter });
        return;
      }

      resolve({ type: 'unknown' });
    })();
  });
}
