import type { Readable } from 'stream';
import Papa from 'papaparse';

import { createDebug } from '../utils/logger';
import type { Delimiter } from '../utils/constants';

const debug = createDebug('import-guess-filetype');

type ListCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
};

type ListCSVFieldsResult = string[];

export async function listCSVFields({
  input,
  delimiter,
}: ListCSVFieldsOptions): Promise<ListCSVFieldsResult> {
  let lines = 0;

  const fields: string[] = [];
  const fieldMap: Record<string, true> = {};

  return new Promise(function (resolve, reject) {
    Papa.parse(input, {
      delimiter,
      step: function (results: Papa.ParseStepResult<string[]>, parser) {
        ++lines;
        debug('listCSVFields:step', lines, results);
        if (lines !== 1) {
          return;
        }

        // remove array indexes so that foo[0], foo[1] becomes foo
        // and bar[0].a, bar[1].a becomes bar.a
        // ie. the whole array counts as one field
        const flattened = results.data.map((name) => {
          return name.replace(/\[\d+\]/, '');
        });

        // make sure that each array field is only included once
        for (const name of flattened) {
          if (!fieldMap[name]) {
            fieldMap[name] = true;
            fields.push(name);
          }
        }

        parser.abort();
      },
      complete: function () {
        debug('listCSVFields:complete');
        resolve(fields);
      },
      error: function (err) {
        debug('listCSVFields:error', err);
        reject(err);
      },
    });
  });
}
