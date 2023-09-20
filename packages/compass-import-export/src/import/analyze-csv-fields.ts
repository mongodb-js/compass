import type { Readable } from 'stream';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import Papa from 'papaparse';
import stripBomStream from 'strip-bom-stream';

import type {
  Delimiter,
  Linebreak,
  CSVDetectableFieldType,
  CSVParsableFieldType,
  CSVField,
  CSVFieldTypeInfo,
} from '../csv/csv-types';
import {
  csvHeaderNameToFieldName,
  detectCSVFieldType,
  overrideDetectedFieldType,
} from '../csv/csv-utils';
import { Utf8Validator } from '../utils/utf8-validator';
import { ByteCounter } from '../utils/byte-counter';

type AnalyzeProgress = {
  bytesProcessed: number;
  docsProcessed: number;
};

type AnalyzeCSVFieldsOptions = {
  input: Readable;
  delimiter: Delimiter;
  newline: Linebreak;
  abortSignal?: AbortSignal;
  progressCallback?: (progress: AnalyzeProgress) => void;
  ignoreEmptyStrings?: boolean;
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
  fields: Record<string, CSVField>,
  rowNum: number,
  data: string[],
  ignoreEmptyStrings?: boolean
) {
  for (const [name, field] of Object.entries(fields)) {
    for (const columnIndex of field.columnIndexes) {
      const original = data[columnIndex] ?? '';
      const type = detectCSVFieldType(original, name, ignoreEmptyStrings);

      if (!field.types[type]) {
        field.types[type] = {
          count: 0,
          firstRowIndex: rowNum,
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
    // This is a bit of an edge case. If a column is always empty and
    // "Ignore empty strings" is checked, we'll detect "undefined".
    // We'll never actually insert undefined due to the checkbox, but
    // undefined as a bson type is deprecated so it might give the wrong
    // impression. We could select any type in the selectbox, so the
    // choice of making it string is arbitrary.
    if (types[0] === 'undefined') {
      return 'string';
    }

    // If there's only one detected type, go with that.
    return overrideDetectedFieldType(types[0] as CSVDetectableFieldType);
  }

  if (types.length === 2) {
    const filtered = types.filter((type) => type !== 'undefined');
    if (filtered.length === 1) {
      // If there are two detected types and one is undefined (ie. an ignored
      // empty string), go with the non-undefined one because undefined values
      // are special-cased during import.
      return overrideDetectedFieldType(filtered[0] as CSVDetectableFieldType);
    }
  }

  // If everything is number-ish (or undefined), go with the made up type
  // 'number'. Behaves much like 'mixed', but makes it a bit clearer to the user
  // what will happen and matches the existing Number entry we have in the field
  // type dropdown.
  if (
    types.every((type) => ['int', 'long', 'double', 'undefined'].includes(type))
  ) {
    return 'number';
  }

  // otherwise stick with the default 'mixed'
  return field.detected;
}

export async function analyzeCSVFields({
  input,
  delimiter,
  newline,
  abortSignal,
  progressCallback,
  ignoreEmptyStrings,
}: AnalyzeCSVFieldsOptions): Promise<AnalyzeCSVFieldsResult> {
  const byteCounter = new ByteCounter();

  const result: AnalyzeCSVFieldsResult = {
    totalRows: 0,
    fields: {},
    aborted: false,
  };

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
    delimiter,
    newline,
  });

  let numRows = 0;
  const analyzeStream = new Transform({
    objectMode: true,
    transform: (chunk: string[], encoding, callback) => {
      if (numRows === 0) {
        const headerFields = chunk;
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
      } else {
        addRowToResult(
          result.fields,
          result.totalRows,
          chunk,
          ignoreEmptyStrings
        );
        result.totalRows = numRows;

        progressCallback?.({
          bytesProcessed: byteCounter.total,
          docsProcessed: result.totalRows,
        });
      }

      ++numRows;
      callback();
    },
  });

  try {
    await pipeline(
      [
        input,
        new Utf8Validator(),
        byteCounter,
        stripBomStream(),
        parseStream,
        analyzeStream,
      ],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      result.aborted = true;
    } else {
      throw err;
    }
  }

  for (const field of Object.values(result.fields)) {
    field.detected = pickFieldType(field);
  }

  return result;
}
