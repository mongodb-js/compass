import type { Readable } from 'stream';
import Papa from 'papaparse';

import type { Delimiter } from '../utils/constants';
import { createDebug } from '../utils/logger';
import { csvHeaderNameToFieldName } from '../utils/csv-header';

const debug = createDebug('analyze-csv-fields');

const MIN_INT = -2147483648;
const MAX_INT = 2147483647;
const MIN_LONG = BigInt('-9223372036854775808');
const MAX_LONG = BigInt('9223372036854775807');
// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1024
const FLOAT = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1025
const ISO_DATE =
  /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;

type AnalyzeCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
  abortSignal: AbortSignal;
  progressCallback: (index: number) => void;
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

// the subset of bson types that we can detect
type CSVFieldType =
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'date'
  | 'string'
  | 'null'
  | 'mixed';

/*
For each field we need the detected types and the column positions. This helps
with accounting for all column indexes, but also the fact that we'd have higher
counts than the number of rows. ie. foo[0],foo[1] means twice as many fields as
rows once it becomes field foo and so does foo[0].bar,foo[1].bar once it becomes
foo.bar.
*/
type CSVField = {
  types: Record<CSVFieldType, CSVFieldTypeInfo>;
  columnIndexes: number[];
  detected: CSVFieldType;
};

type AnalyzeCSVFieldsResult = {
  totalRows: number;
  aborted: boolean;
  fields: Record<string, CSVField>;
};

function detectFieldType(value: string): CSVFieldType {
  // mongoexport and existing compass style nulls
  if (!value || value === 'Null') {
    return 'null';
  } else if (value === 'true' || value === 'TRUE') {
    return 'boolean';
  } else if (value === 'false' || value === 'FALSE') {
    return 'boolean';
  } else if (FLOAT.test(value)) {
    // first separate floating point numbers from integers

    // 1.0 should be double
    if (value.includes('.') || /[Ee][+-]?/.test(value)) {
      return 'double';
    }

    let number;
    try {
      number = BigInt(value);
    } catch (err) {
      // just in case something makes it past the regex by accident
      return 'string';
    }

    // then separate ints from longs
    if (number >= MIN_LONG && number <= MAX_LONG) {
      if (number >= MIN_INT && number <= MAX_INT) {
        return 'int';
      }
      return 'long';
    }

    // really big integers will remain as strings
    return 'string';
  } else if (ISO_DATE.test(value)) {
    return 'date';
  }

  return 'string';
}

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
  data: PapaRowData
) {
  for (const field of Object.values(result.fields)) {
    for (const columnIndex of field.columnIndexes) {
      const name = headerFields[columnIndex];
      const original = data[name] ?? '';
      const type = detectFieldType(original);
      debug('detectFieldType', name, original, type);

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

function pickFieldType(field: CSVField): CSVFieldType {
  const types = Object.keys(field.types);

  if (types.length === 1) {
    // If there's only one detected type, go with that.
    return types[0] as CSVFieldType;
  }

  if (types.length === 2) {
    const filtered = types.filter((type) => type !== 'null');
    if (filtered.length === 1) {
      // If there are two detected types and one is null, go with the non-null
      // one because null/empty values are special-cased during import.
      return filtered[0] as CSVFieldType;
    }
  }

  // otherwise stick with the default 'mixed'
  return field.detected;
}

export function analyzeCSVFields({
  input,
  delimiter,
  abortSignal,
  progressCallback,
}: AnalyzeCSVFieldsOptions): Promise<AnalyzeCSVFieldsResult> {
  const result: AnalyzeCSVFieldsResult = {
    totalRows: 0,
    fields: {},
    aborted: false,
  };

  let aborted = false;
  let headerFields: string[];

  return new Promise(function (resolve, reject) {
    Papa.parse(input, {
      delimiter,
      header: true,
      step: function (results: Papa.ParseStepResult<PapaRowData>, parser) {
        debug('analyzeCSVFields:step', results);

        if (abortSignal.aborted && !aborted) {
          aborted = true;
          result.aborted = true;
          parser.abort();
        }

        if (!headerFields) {
          headerFields = results.meta.fields ?? [];
          initResultFields(result, headerFields);
        }

        addRowToResult(result, headerFields, results.data);

        ++result.totalRows;

        progressCallback(result.totalRows);
      },
      complete: function () {
        debug('analyzeCSVFields:complete');

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
