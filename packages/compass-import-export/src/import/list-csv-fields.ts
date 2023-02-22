import type { Readable } from 'stream';
import Papa from 'papaparse';

import { createDebug } from '../utils/logger';
import type { Delimiter } from '../utils/csv';
import { csvHeaderNameToFieldName } from '../utils/csv';

const debug = createDebug('list-csv-fields');

const NUM_PREVIEW_FIELDS = 5;

type ListCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
};

type ListCSVFieldsResult = {
  uniqueFields: string[];
  headerFields: string[];
  preview: string[][];
};

export async function listCSVFields({
  input,
  delimiter,
}: ListCSVFieldsOptions): Promise<ListCSVFieldsResult> {
  let lines = 0;

  const result: ListCSVFieldsResult = {
    uniqueFields: [],
    headerFields: [],
    preview: [],
  };

  // TODO: deal with BOM and utf-8 validation here too

  return new Promise(function (resolve, reject) {
    Papa.parse(input, {
      delimiter,
      step: function (results: Papa.ParseStepResult<string[]>, parser) {
        ++lines;
        debug('listCSVFields:step', lines, results);

        if (lines === 1) {
          result.headerFields = results.data;

          // remove array indexes so that foo[0], foo[1] becomes foo
          // and bar[0].a, bar[1].a becomes bar.a
          // ie. the whole array counts as one field
          const flattened = results.data.map(csvHeaderNameToFieldName);

          const fieldMap: Record<string, true> = {};

          // make sure that each array field is only included once
          for (const name of flattened) {
            if (!fieldMap[name]) {
              fieldMap[name] = true;
              result.uniqueFields.push(name);
            }
          }

          return;
        }

        result.preview.push(results.data);

        if (lines === NUM_PREVIEW_FIELDS + 1) {
          parser.abort();
        }
      },
      complete: function () {
        debug('listCSVFields:complete');
        resolve(result);
      },
      error: function (err) {
        debug('listCSVFields:error', err);
        reject(err);
      },
    });
  });
}
