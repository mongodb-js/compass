import type { Readable } from 'stream';
import Papa from 'papaparse';
import stripBomStream from 'strip-bom-stream';

import { createDebug } from '../utils/logger';
import type {
  Delimiter,
  CSVDetectableFieldType,
  CSVParsableFieldType,
} from '../utils/csv';
import { csvHeaderNameToFieldName, detectFieldType } from '../utils/csv';
import { Utf8Validator } from '../utils/utf8-validator';
import { ByteCounter } from '../utils/byte-counter';

const debug = createDebug('analyze-csv-fields');

type AnalyzeProgress = {
  bytesProcessed: number;
  docsProcessed: number;
};

type AnalyzeCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
  abortSignal?: AbortSignal;
  progressCallback?: (progress: AnalyzeProgress) => void;
  ignoreEmptyStrings?: boolean;
};

type PapaRowData = Record<string, string>;

type CSVFieldTypeInfo = {
  // How many cells in the file matched this type.
  count: number;

  // The line in the file where this field was first detected to be of this
  // type. This is so the field type selector can immediately present that line
  // or document as a counter example if the user selects an incompatible field
  // type.
  firstRowIndex: number;
  firstColumnIndex: number;
  firstValue: string;
};

/*
For each field we need the detected types and the column positions. This helps
with accounting for all column indexes, but also the fact that we'd have higher
counts than the number of rows. ie. foo[0],foo[1] means twice as many fields as
rows once it becomes field foo and so does foo[0].bar,foo[1].bar once it becomes
foo.bar.
*/
type CSVField = {
  types: Record<CSVDetectableFieldType, CSVFieldTypeInfo>;
  columnIndexes: number[];
  detected: CSVParsableFieldType;
};

export type AnalyzeCSVFieldsResult = {
  totalRows: number;
  aborted: boolean;
  fields: Record<string, CSVField>;
};

function initResultFields(
  result: AnalyzeCSVFieldsResult,
  headerFields: string[]
) {
  for (const [columnIndex, name] of headerFields.entries()) {
    const fieldName = csvHeaderNameToFieldName(name);

    if (!result.fields[fieldName]) {
      result.fields[fieldName] = {
        types: {} as Record<string, CSVFieldTypeInfo>,
        columnIndexes: [],
        detected: 'mixed', // we'll fill this at the end
      };
    }

    // For fields inside arrays different CSV header fields can map to
    // the same fieldName, so there will be more than one entry in
    // columnIndex.
    result.fields[fieldName].columnIndexes.push(columnIndex);
  }
}

function addRowToResult(
  result: AnalyzeCSVFieldsResult,
  headerFields: string[],
  data: PapaRowData,
  ignoreEmptyStrings?: boolean
) {
  for (const field of Object.values(result.fields)) {
    for (const columnIndex of field.columnIndexes) {
      const name = headerFields[columnIndex];
      const original = data[name] ?? '';
      const type = detectFieldType(original, ignoreEmptyStrings);

      if (!field.types[type]) {
        field.types[type] = {
          count: 0,
          firstRowIndex: result.totalRows,
          firstColumnIndex: columnIndex,
          firstValue: original,
        };
      }

      ++field.types[type].count;
    }
  }
}

function pickFieldType(field: CSVField): CSVParsableFieldType {
  const types = Object.keys(field.types);

  if (types.length === 1) {
    // If there's only one detected type, go with that.
    return types[0] as CSVDetectableFieldType;
  }

  if (types.length === 2) {
    const filtered = types.filter((type) => type !== 'undefined');
    if (filtered.length === 1) {
      // If there are two detected types and one is undefined (ie. an ignored
      // empty string), go with the non-undefined one because undefined values
      // are special-cased during import.
      return filtered[0] as CSVDetectableFieldType;
    }
  }

  // If everything is number-ish (or undefined), go with the made up type
  // 'number'. Behaves much like 'mixed', but makes it a bit clearer to the user
  // what will happen and matches the existing Number entry we have in the field
  // type dropdown.
  if (
    types.every((type) => ['int', 'long', 'double', 'undefined'].includes(type))
  ) {
    // TODO: this needs tests
    return 'number';
  }

  // otherwise stick with the default 'mixed'
  return field.detected;
}

export function analyzeCSVFields({
  input,
  delimiter,
  abortSignal,
  progressCallback,
  ignoreEmptyStrings,
}: AnalyzeCSVFieldsOptions): Promise<AnalyzeCSVFieldsResult> {
  return new Promise(function (resolve, reject) {
    const byteCounter = new ByteCounter();

    const result: AnalyzeCSVFieldsResult = {
      totalRows: 0,
      fields: {},
      aborted: false,
    };

    let aborted = false;
    let headerFields: string[];

    const validator = new Utf8Validator();

    validator.once('error', function (err: any) {
      reject(err);
    });

    input = input.pipe(validator).pipe(byteCounter).pipe(stripBomStream());

    Papa.parse(input, {
      delimiter,
      header: true,
      step: function (results: Papa.ParseStepResult<PapaRowData>, parser) {
        if (abortSignal?.aborted && !aborted) {
          aborted = true;
          result.aborted = true;
          parser.abort();
        }

        if (!headerFields) {
          headerFields = results.meta.fields ?? [];
          // There's a quirk in papaparse where it extracts header fields before
          // it finishes auto-detecting the line endings. We could pass in a
          // line ending that we previously detected (in guessFileType(),
          // perhaps?) or we can just strip the extra \r from the final header
          // name if it exists.
          if (headerFields.length) {
            const lastName = headerFields[headerFields.length - 1];
            headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
          }

          initResultFields(result, headerFields);
        }

        addRowToResult(result, headerFields, results.data, ignoreEmptyStrings);

        ++result.totalRows;

        progressCallback?.({
          bytesProcessed: byteCounter.total,
          docsProcessed: result.totalRows,
        });
      },
      complete: function () {
        for (const field of Object.values(result.fields)) {
          field.detected = pickFieldType(field);
        }
        resolve(result);
      },
      error: function (err) {
        debug('analyzeCSVFields:error', err);
        reject(err);
      },
    });
  });
}
