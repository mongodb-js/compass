import fs from 'fs';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import { pipeline } from 'stream/promises';
import temp from 'temp';
import { Transform } from 'stream';
import type { Readable, Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import Parser from 'stream-json/Parser';
import StreamValues from 'stream-json/streamers/StreamValues';

import { lookupValueForPath, ColumnRecorder } from './export-utils';
import {
  stringifyCSVValue,
  formatCSVLine,
  formatCSVValue,
} from '../csv/csv-utils';
import type {
  ExportAggregation,
  ExportQuery,
  ExportResult,
} from './export-types';

import { formatCSVHeaderName } from '../csv/csv-utils';
import type { Delimiter, Linebreak, PathPart } from '../csv/csv-types';
import { createDebug } from '../utils/logger';
import type { AggregationCursor, FindCursor } from 'mongodb';

const debug = createDebug('export-csv');

// First we download all the docs for the query/aggregation to a temporary file
// while determining the unique set of columns we'll need and their order
// (DOWNLOAD), then we write the header row, then process that temp file in
// order to write each row's cells in the correct column order (WRITE). ie
// progress counts up from 1 to however many documents are being exported twice.
export type CSVExportPhase = 'DOWNLOAD' | 'WRITE';

export type ProgressCallback = (index: number, phase: CSVExportPhase) => void;

type ExportCSVOptions = {
  input: Readable;
  columns: PathPart[][];
  output: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: ProgressCallback;
  delimiter?: Delimiter;
  linebreak?: Linebreak;
};

class CSVRowStream extends Transform {
  columns: PathPart[][];
  docsWritten: number;
  linebreak: Linebreak;
  delimiter: Delimiter;
  progressCallback?: ProgressCallback;

  constructor({
    columns,
    delimiter,
    linebreak,
    progressCallback,
  }: {
    columns: PathPart[][];
    delimiter: Delimiter;
    linebreak: Linebreak;
    progressCallback?: ProgressCallback;
  }) {
    super({ objectMode: true });
    this.docsWritten = 0;
    this.columns = columns;
    this.progressCallback = progressCallback;
    this.delimiter = delimiter;
    this.linebreak = linebreak;
  }

  _transform(
    chunk: Document,
    enc: unknown,
    cb: (err: null | Error, ejson?: any) => void
  ) {
    this.docsWritten++;
    // We don't debug on every line passed as it will significantly slow down the
    // export, however this is useful when diagnosing issues.
    //debug('CSVRowStream', { chunk });
    try {
      const row = this.columns.map((path) => lookupValueForPath(chunk, path));
      const values = row.map((value) =>
        stringifyCSVValue(value, {
          delimiter: this.delimiter,
        })
      );

      // We don't debug on every line passed as it will significantly slow down the
      // export, however this is useful when diagnosing issues.
      //const doc = _.zipObject(this.columns.map(formatCSVHeaderName), values);
      //console.dir(doc, { depth: Infinity });

      const line = formatCSVLine(values, {
        delimiter: this.delimiter,
        linebreak: this.linebreak,
      });
      this.progressCallback?.(this.docsWritten, 'WRITE');

      cb(null, line);
    } catch (err: any) {
      cb(err as Error);
    }
  }
}

// You probably want to use exportCSVFromAggregation() or exportCSVFromQuery() rather
async function _exportCSV({
  output,
  abortSignal,
  input,
  columns,
  progressCallback,
  delimiter = ',',
  linebreak = '\n',
}: ExportCSVOptions): Promise<ExportResult> {
  const headers = columns.map((path) => formatCSVHeaderName(path));
  output.write(
    formatCSVLine(
      headers.map((header) => formatCSVValue(header, { delimiter })),
      { delimiter, linebreak }
    )
  );

  const rowStream = new CSVRowStream({
    columns,
    delimiter,
    linebreak,
    progressCallback,
  });

  try {
    await pipeline(
      [input, rowStream, output],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      return {
        docsWritten: rowStream.docsWritten,
        aborted: true,
      };
    }

    throw err;
  }

  return {
    docsWritten: rowStream.docsWritten,
    aborted: !!abortSignal?.aborted,
  };
}

class EJSONStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: { value: Document },
    enc: unknown,
    cb: (err: null | Error, ejson: any) => void
  ) {
    // We don't debug on every line passed as it will significantly slow down the
    // export, however this is useful when diagnosing issues.
    //debug('EJSONStream', { chunk });
    // We need relaxed: false so that BSONSymbols and possibly other values will
    // be bson values and not strings or numbers. That way we can unambiguously
    // serialize them.
    cb(null, EJSON.deserialize(chunk.value, { relaxed: false }));
  }
}

class ColumnStream extends Transform {
  docsProcessed: number;
  columnRecorder: ColumnRecorder;
  progressCallback?: ProgressCallback;

  constructor(progressCallback?: ProgressCallback) {
    super({ objectMode: true });
    this.docsProcessed = 0;
    this.columnRecorder = new ColumnRecorder();
    this.progressCallback = progressCallback;
  }

  _transform(
    chunk: Document,
    enc: unknown,
    cb: (err: null | Error, ejson: any) => void
  ) {
    // We don't debug on every line passed as it will significantly slow down the
    // export, however this is useful when diagnosing issues.
    //debug('ColumnStream', { chunk });
    this.columnRecorder.addToColumns(chunk);
    this.docsProcessed++;
    this.progressCallback?.(this.docsProcessed, 'DOWNLOAD');

    cb(null, `${EJSON.stringify(chunk, { relaxed: true })}\n`);
  }

  getColumns() {
    return this.columnRecorder.columns;
  }
}

async function loadEJSONFileAndColumns({
  cursor,
  abortSignal,
  progressCallback,
}: {
  cursor: AggregationCursor | FindCursor;
  abortSignal?: AbortSignal;
  progressCallback?: (index: number, phase: CSVExportPhase) => void;
}): Promise<{ filename: string; input: Readable; columns: PathPart[][] }> {
  // Write the cursor to a temp file containing one ejson doc per line
  // while simultaneously determining the unique set of columns in the order
  // we'll have to write to the file.
  const inputStream = cursor.stream();
  const filename = temp.path({ suffix: '.jsonl' });
  const output = fs.createWriteStream(filename);

  const columnStream = new ColumnStream(progressCallback);

  try {
    await pipeline(
      [inputStream, columnStream, output],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
  } finally {
    void cursor.close();
  }

  const columns = columnStream.getColumns();

  debug('columns', JSON.stringify(columns));

  // Make a stream of EJSON documents for the temp file
  const input = fs
    .createReadStream(filename)
    .pipe(Parser.parser({ jsonStreaming: true }))
    .pipe(StreamValues.streamValues())
    .pipe(new EJSONStream());

  debug(`writing to ${filename}`);

  return { filename, input, columns };
}

export async function exportCSVFromAggregation({
  ns,
  aggregation,
  dataService,
  ...exportOptions
}: Omit<ExportCSVOptions, 'input' | 'columns'> & {
  ns: string;
  dataService: Pick<DataService, 'aggregateCursor'>;
  aggregation: ExportAggregation;
}) {
  debug('exportCSVFromAggregation()', { ns: toNS(ns), aggregation });

  const { stages, options: aggregationOptions = {} } = aggregation;
  aggregationOptions.maxTimeMS = capMaxTimeMSAtPreferenceLimit(
    aggregationOptions.maxTimeMS
  );
  aggregationOptions.promoteValues = false;
  aggregationOptions.bsonRegExp = true;
  const aggregationCursor = dataService.aggregateCursor(
    ns,
    stages,
    aggregationOptions
  );

  let filename, input, columns;
  try {
    try {
      ({ filename, input, columns } = await loadEJSONFileAndColumns({
        cursor: aggregationCursor,
        abortSignal: exportOptions.abortSignal,
        progressCallback: exportOptions.progressCallback,
      }));
    } catch (err: any) {
      if (err.code === 'ABORT_ERR') {
        // aborted while still in the download phase, so no docs written yet
        return {
          docsWritten: 0,
          aborted: true,
        };
      }
      throw err;
    } finally {
      // at this point we don't need the cursor anymore, because we've
      // downloaded all the rows to a temporary file
      void aggregationCursor.close();
    }

    return await _exportCSV({
      ...exportOptions,
      input,
      columns,
    });
  } finally {
    if (filename) {
      // clean up the temporary file
      void fs.promises.rm(filename);
    }
  }
}

export async function exportCSVFromQuery({
  ns,
  query = { filter: {} },
  dataService,
  ...exportOptions
}: Omit<ExportCSVOptions, 'input' | 'columns'> & {
  ns: string;
  dataService: Pick<DataService, 'findCursor'>;
  query?: ExportQuery;
}) {
  debug('exportCSVFromQuery()', { ns: toNS(ns), query });

  const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
    projection: query.projection,
    sort: query.sort,
    limit: query.limit,
    skip: query.skip,
    collation: query.collation,
    promoteValues: false,
    bsonRegExp: true,
  });

  let filename, input, columns;

  try {
    try {
      ({ filename, input, columns } = await loadEJSONFileAndColumns({
        cursor: findCursor,
        abortSignal: exportOptions.abortSignal,
        progressCallback: exportOptions.progressCallback,
      }));
    } catch (err: any) {
      if (err.code === 'ABORT_ERR') {
        // aborted while still in the download phase, so no docs written yet
        return {
          docsWritten: 0,
          aborted: true,
        };
      }
      throw err;
    } finally {
      // at this point we don't need the cursor anymore, because we've
      // downloaded all the rows to a temporary file
      void findCursor.close();
    }

    return await _exportCSV({
      ...exportOptions,
      input,
      columns,
    });
  } finally {
    if (filename) {
      // clean up the temporary file
      void fs.promises.rm(filename);
    }
  }
}
