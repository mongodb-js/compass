import type { Readable } from 'stream';
import Papa from 'papaparse';
import stripBomStream from 'strip-bom-stream';

import { createDebug } from '../utils/logger';
import type { Delimiter, Linebreak } from '../csv/csv-types';
import { csvHeaderNameToFieldName } from '../csv/csv-utils';
import { Utf8Validator } from '../utils/utf8-validator';

const debug = createDebug('list-csv-fields');

const NUM_PREVIEW_FIELDS = 10;

type ListCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
  newline: Linebreak;
};

type ListCSVFieldsResult = {
  uniqueFields: string[];
  headerFields: string[];
  preview: string[][];
};

export async function listCSVFields({
  input,
  delimiter,
  newline,
}: ListCSVFieldsOptions): Promise<ListCSVFieldsResult> {
  return new Promise(function (resolve, reject) {
    let lines = 0;

    const result: ListCSVFieldsResult = {
      uniqueFields: [],
      headerFields: [],
      preview: [],
    };

    const validator = new Utf8Validator();

    validator.once('error', function (err: any) {
      reject(err);
    });

    input = input.pipe(validator).pipe(stripBomStream());

    Papa.parse(input, {
      delimiter,
      newline,
      step: function (results: Papa.ParseStepResult<string[]>, parser) {
        ++lines;
        debug('listCSVFields:step', lines, results);

        if (lines === 1) {
          const headerFields = results.data;

          // There's a quirk in papaparse where it extracts header fields before
          // it finishes auto-detecting the line endings. We could pass in a
          // line ending that we previously detected (in guessFileType(),
          // perhaps?) or we can just strip the extra \r from the final header
          // name if it exists.
          if (headerFields.length) {
            const lastName = headerFields[headerFields.length - 1];
            headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
          }

          result.headerFields = headerFields;

          // remove array indexes so that foo[0], foo[1] becomes foo
          // and bar[0].a, bar[1].a becomes bar.a
          // ie. the whole array counts as one field
          const flattened = headerFields.map(csvHeaderNameToFieldName);

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
          // Aborting the parser does not destroy the input stream. If we don't
          // destroy the input stream it will try and read the entire file into
          // memory.
          input.destroy();
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
