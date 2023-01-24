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

type AnalyzeCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
  abortSignal: AbortSignal;
  progressCallback: (index: number) => void;
};

// see parseDynamic() in papaparse.js:
// https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1225
type PapaValue = boolean | number | Date | null | string;

type PapaRowData = Record<string, PapaValue>;

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

function detectFieldType(value: PapaValue): CSVFieldType {
  // papaparse handles some types for us, so get those out of the way first
  if (value === null) {
    return 'null';
  }
  if (Object.prototype.toString.call(value) === '[object Date') {
    return 'date';
  }
  const jsType = typeof value;
  if (jsType === 'boolean') {
    return 'boolean';
  }

  // papaparse will make anything > -2^^53 and < 2^^53 a number (via parseFloat)
  // and leave any number outside of that range a string.
  if (jsType === 'number') {
    // first separate floating point numbers from integers
    if (value.toString().includes('.')) {
      return 'double';
    }
    // then separate ints from longs
    if (value >= MIN_INT && value <= MAX_INT) {
      return 'int';
    }
    return 'long';
  }

  // now deal with remaining large ints
  try {
    const number = BigInt(value as string);
    if (number >= MIN_LONG && number <= MAX_LONG) {
      return 'long';
    }
    return 'string';
  } catch (err) {
    // If it doesn't parse as a BigInt, then just fall back to string.
    // We might still want to check the string for certain patterns, though.
    return 'string';
  }
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
  data: PapaRowData,
  currentRow: Record<string, string>
) {
  for (const field of Object.values(result.fields)) {
    for (const columnIndex of field.columnIndexes) {
      const name = headerFields[columnIndex];
      const value = data[name];
      const type = detectFieldType(value);
      debug('detectFieldType', name, value, type);

      if (!field.types[type]) {
        field.types[type] = {
          count: 0,
          firstRowIndex: result.totalRows,
          firstColumnIndex: columnIndex,
          firstValue: currentRow[name] ?? '', // the original string, not the PapaValue
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
  const currentRow: Record<string, string> = {};

  return new Promise(function (resolve, reject) {
    Papa.parse(input, {
      delimiter,
      header: true,
      dynamicTyping: true,
      transform: function (value: string, field: string | number) {
        // collect the strings before dynamicTyping tries to parse them so that
        // we can use the original values as firstValue
        currentRow[field] = value;
        return value;
      },
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

        addRowToResult(result, headerFields, results.data, currentRow);

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
