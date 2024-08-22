import type { Document } from 'bson';
import type { Readable } from 'stream';
import Papa from 'papaparse';
import toNS from 'mongodb-ns';

import { makeDocFromCSV, parseCSVHeaderName } from '../csv/csv-utils';
import { doImport } from './import-utils';
import type {
  Delimiter,
  Linebreak,
  IncludedFields,
  PathPart,
} from '../csv/csv-types';
import type { ImportResult, ImportOptions } from './import-types';
import { createDebug } from '../utils/logger';

const debug = createDebug('import-csv');

type ImportCSVOptions = ImportOptions & {
  input: Readable;
  delimiter?: Delimiter;
  newline: Linebreak;
  ignoreEmptyStrings?: boolean;
  fields: IncludedFields; // the type chosen by the user to make each field
};

class CSVTransformer {
  fields: IncludedFields;
  ignoreEmptyStrings?: boolean;
  headerFields: string[];
  parsedHeader?: Record<string, PathPart[]>;

  constructor({
    fields,
    ignoreEmptyStrings,
  }: {
    fields: IncludedFields;
    ignoreEmptyStrings?: boolean;
  }) {
    this.fields = fields;
    this.ignoreEmptyStrings = ignoreEmptyStrings;
    this.headerFields = [];
  }

  addHeaderField(field: string) {
    this.headerFields.push(field);
  }

  transform(row: Record<string, string>): Document {
    if (!this.parsedHeader) {
      // There's a quirk in papaparse where it calls transformHeader()
      // before it finishes auto-detecting the line endings. We could pass
      // in a line ending that we previously detected (in guessFileType(),
      // perhaps?) or we can just strip the extra \r from the final header
      // name if it exists.
      if (this.headerFields.length) {
        const fixupFrom = this.headerFields[this.headerFields.length - 1];
        const fixupTo = fixupFrom.replace(/\r$/, '');
        this.headerFields[this.headerFields.length - 1] = fixupTo;
      }

      this.parsedHeader = {};
      for (const name of this.headerFields) {
        this.parsedHeader[name] = parseCSVHeaderName(name);
      }

      // TODO(COMPASS-7158): make sure array indexes start at 0 and have no
      // gaps, otherwise clean them up (ie. treat those parts as part of the
      // field name). So that you can't have a foo[1000000]
      // edge case.
    }

    return makeDocFromCSV(
      row,
      this.headerFields,
      this.parsedHeader,
      this.fields,
      {
        ignoreEmptyStrings: this.ignoreEmptyStrings,
      }
    );
  }
}

export async function importCSV({
  dataService,
  ns,
  input,
  output,
  abortSignal,
  progressCallback,
  errorCallback,
  delimiter = ',',
  newline,
  ignoreEmptyStrings,
  stopOnErrors,
  fields,
}: ImportCSVOptions): Promise<ImportResult> {
  debug('importCSV()', { ns: toNS(ns), stopOnErrors });

  if (ns === 'test.compass-import-abort-e2e-test') {
    // Give the test more than enough time to click the abort before we continue.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  const transformer = new CSVTransformer({ fields, ignoreEmptyStrings });

  const parseStream = Papa.parse(Papa.NODE_STREAM_INPUT, {
    delimiter,
    newline,
    header: true,
    transformHeader: function (header: string, index: number): string {
      debug('importCSV:transformHeader', header, index);
      transformer.addHeaderField(header);
      return header;
    },
  });

  const streams = [parseStream];

  return doImport(input, streams, transformer, {
    dataService,
    ns,
    output,
    abortSignal,
    progressCallback,
    errorCallback,
    stopOnErrors,
  });
}
