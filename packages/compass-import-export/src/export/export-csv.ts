import _ from 'lodash';
import fs from 'fs';
import { EJSON } from 'bson';
import type { BSONRegExp } from 'bson';
import { pipeline } from 'stream/promises';
import temp from 'temp';
import { Transform } from 'stream';
import type { Readable, Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import Parser from 'stream-json/Parser';
import StreamValues from 'stream-json/streamers/StreamValues';

import type { ExportAggregation, ExportQuery, ExportResult } from './types';

import { formatHeaderName } from '../utils/csv';
import type { PathPart } from '../utils/csv';
import { createDebug } from '../utils/logger';
import type { AggregationCursor, FindCursor } from 'mongodb';

const debug = createDebug('export-csv');

// First we download all the docs for the query/aggregation to a temporary file
// while determining the unique set of columns we'll need and their order
// (DOWNLOAD), then we write the header row, then process that temp file in
// order to write each row's cells in the correct column order (WRITE). ie
// progress counts up from 1 to however many documents are being exported twice.
type CSVExportPhase = 'DOWNLOAD' | 'WRITE';

type ProgressCallback = (index: number, phase: CSVExportPhase) => void;

type ExportCSVOptions = {
  input: Readable;
  columns: PathPart[][];
  output: Writable;
  abortSignal?: AbortSignal;
  progressCallback?: ProgressCallback;
};

function lookupValueForPath(
  row: Document,
  path: PathPart[],
  allowObjectsAndArrays?: boolean
): any {
  /*
  Descend along objects and arrays to find a BSON value (ie. something that's
  not an object or an array) that we can stringify and put in a field.
  It is possible that not all docs have the same structure which is where we
  sometimes return undefined below.

  Imagine a collection:
  {foo: ['x']}
  {foo: { bar: 'y' }}
  {foo: 'z'}

  It would have the following columns:
  foo[0]
  foo.bar
  foo

  For each of the documents above it will return a string for one of the columns
  and undefined for the other two. Unless allowObjectsAndArrays is true, then
  the path "foo" will always return something that's not undefined. This is so
  we can support optionally serializing arrays and objects as EJSON strings.
  */

  let value: any = row;

  for (const part of path) {
    if (part.type === 'index') {
      if (Array.isArray(value)) {
        value = value[part.index];
      } else {
        return undefined;
      }
    } else {
      if (_.isPlainObject(value)) {
        value = value[part.name];
      } else {
        return undefined;
      }
    }
  }

  if (allowObjectsAndArrays) {
    return value;
  }

  if (Array.isArray(value)) {
    return undefined;
  }

  if (_.isPlainObject(value)) {
    return undefined;
  }

  return value;
}

function trimQuotes(value: string): string {
  if (
    value.length >= 2 &&
    value[0] === '"' &&
    value[value.length - 1] === '"'
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function formatValue(
  value: string,
  {
    escapeQuotes = true,
    escapeLinebreaks = false,
  }: {
    escapeQuotes?: boolean;
    escapeLinebreaks?: boolean;
  } = {}
) {
  if (escapeQuotes) {
    value = value.replace(/"/g, '""');
  }

  if (escapeLinebreaks) {
    // This should only really be necessary for values that started out as
    // arbitrary strings. Usually our conversion to a string takes care of this.
    // ie. numbers are never going to have line breaks in them and
    // EJSON.stringify() takes care of it.
    // (Yes CSV has no standard way of escaping line breaks or anything other
    //  than double quotes.)
    value = value.replace(/\n/g, '\\n');
  }

  if (value.indexOf(',') !== -1) {
    // Put quotes around a value if it contains the delimiter. This will
    // also affect EJSON objects and arrays
    value = `"${value}"`;
  }

  return value;
}

function formatLine(values: string[]): string {
  // always comma as delimiter and unix style line breaks
  return `${values.join(',')}\n`;
}

function stringifyValue(value: any): string {
  if ([null, undefined].includes(value as null | undefined)) {
    return '';
  }

  const bsonType = value._bsontype;

  if (!bsonType) {
    if (typeof value === 'string') {
      return formatValue(trimQuotes(EJSON.stringify(value)), {
        escapeLinebreaks: true,
      });
    }

    if (Object.prototype.toString.call(value) === '[object Date]') {
      return value.toISOString();
    }

    if (['number', 'boolean'].includes(typeof value)) {
      return formatValue(value.toString() as string);
    }

    // Arrays and plain objects that somehow made it here plus unforeseen things
    // that don't have a _bsontype.
    // NOTE: Not escaping quotes for objects and arrays. This results in
    // technically not valid CSV since the quotes around attribute names have to
    // be escaped, but that's how mongoexport deals with arrays and objects, it
    // is our backup plan for arrays and objects and also most modern CSV
    // parsers are only concerned about quotes at the start and end of a field,
    // not in the middle.
    return formatValue(EJSON.stringify(value), { escapeQuotes: false });
  }

  if (value.toHexString) {
    // ObjectId and UUID both have toHexString() which does exactly what we want
    return value.toHexString();
  }

  if (bsonType === 'Binary') {
    return formatValue(value.toString() as string, { escapeLinebreaks: true });
  }

  if (bsonType === 'BSONRegExp') {
    const bsonregex = value as BSONRegExp;
    return formatValue(`/${bsonregex.pattern}/${bsonregex.options}`);
  }

  if (bsonType === 'Decimal128') {
    // This should turn it into a number string with exponent
    return value.toString();
  }

  if (bsonType === 'Timestamp') {
    // This should turn it into a number string
    return value.toString();
  }

  // Code, MinKey, MaxKey, DBRef and whatever new types get added
  return formatValue(EJSON.stringify(value), { escapeQuotes: false });
}

export class CSVRowStream extends Transform {
  columns: PathPart[][];
  docsWritten: number;
  progressCallback?: ProgressCallback;

  constructor(columns: PathPart[][], progressCallback?: ProgressCallback) {
    super({ objectMode: true });
    this.docsWritten = 0;
    this.columns = columns;
    this.progressCallback = progressCallback;
  }

  _transform(
    chunk: Document,
    enc: unknown,
    cb: (err: null | Error, ejson?: any) => void
  ) {
    this.docsWritten++;
    //debug('CSVRowStream', { chunk });
    try {
      const row = this.columns.map((path) => lookupValueForPath(chunk, path));
      const values = row.map(stringifyValue);

      const headers = this.columns.map((path) => formatHeaderName(path));
      console.log(_.zipObject(headers, values));

      const line = formatLine(values);
      this.progressCallback?.(this.docsWritten, 'WRITE');
      cb(null, line);
    } catch (err: any) {
      cb(err as Error);
    }
  }
}

export async function exportCSV({
  output,
  abortSignal,
  input,
  columns,
  progressCallback,
}: ExportCSVOptions): Promise<ExportResult> {
  const headers = columns.map((path) => formatHeaderName(path));
  output.write(formatLine(headers.map((header) => formatValue(header, true))));

  const rowStream = new CSVRowStream(columns, progressCallback);

  await pipeline(
    [input, rowStream, output],
    ...(abortSignal ? [{ signal: abortSignal }] : [])
  );

  return {
    docsWritten: rowStream.docsWritten,
    aborted: !!abortSignal?.aborted,
  };
}

export class EJSONStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(
    chunk: { value: Document },
    enc: unknown,
    cb: (err: null | Error, ejson: any) => void
  ) {
    //debug('EJSONStream', { chunk });
    cb(null, EJSON.deserialize(chunk.value, { relaxed: true }));
  }
}

export class ColumnStream extends Transform {
  docsProcessed: number;
  columnCache: Record<string, true>;
  columns: PathPart[][];
  progressCallback?: ProgressCallback;

  constructor(progressCallback?: ProgressCallback) {
    super({ objectMode: true });
    this.docsProcessed = 0;
    this.columnCache = {};
    this.columns = [];
    this.progressCallback = progressCallback;
  }

  cacheKey(path: PathPart[]) {
    // something that will make Record<> happy
    return JSON.stringify(path);
  }

  addToColumns(value: any, path: PathPart[]) {
    // Something to keep in mind is that with arrays and objects we could
    // potentially have an enormous amount of distinct paths. In that case we
    // might want to either error or just EJSON.stringify() the top-level field.
    if (Array.isArray(value)) {
      for (const [index, child] of value.entries()) {
        this.addToColumns(child, [...path, { type: 'index', index }]);
      }
    } else if (_.isPlainObject(value)) {
      for (const [name, child] of Object.entries(
        value as Record<string, any>
      )) {
        this.addToColumns(child, [...path, { type: 'field', name }]);
      }
    } else {
      const cacheKey = this.cacheKey(path);
      if (!this.columnCache[cacheKey]) {
        this.columnCache[cacheKey] = true;
        this.columns.push(path);
      }
    }
  }

  _transform(
    chunk: Document,
    enc: unknown,
    cb: (err: null | Error, ejson: any) => void
  ) {
    //debug('ColumnStream', { chunk });
    this.addToColumns(chunk, []);
    this.progressCallback?.(this.docsProcessed, 'DOWNLOAD');
    this.docsProcessed++;
    cb(null, `${EJSON.stringify(chunk, { relaxed: true })}\n`);
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

  const columns = columnStream.columns;

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
}: Omit<ExportCSVOptions, 'input' | 'column'> & {
  ns: string;
  dataService: DataService;
  aggregation: ExportAggregation;
}) {
  debug('exportJSONFromAggregation()', { ns: toNS(ns) });

  const { stages, options: aggregationOptions } = aggregation;
  aggregationOptions.maxTimeMS = capMaxTimeMSAtPreferenceLimit(
    aggregationOptions.maxTimeMS
  );
  const aggregationCursor = dataService.aggregateCursor(
    ns,
    stages,
    aggregationOptions
  );

  const { filename, input, columns } = await loadEJSONFileAndColumns({
    cursor: aggregationCursor,
    abortSignal: exportOptions.abortSignal,
    progressCallback: exportOptions.progressCallback,
  });

  try {
    return await exportCSV({
      ...exportOptions,
      input,
      columns,
    });
  } finally {
    void aggregationCursor.close();
    void fs.promises.rm(filename);
  }
}

export async function exportCSVFromQuery({
  ns,
  query = { filter: {} },
  dataService,
  ...exportOptions
}: Omit<ExportCSVOptions, 'input' | 'columns'> & {
  ns: string;
  dataService: DataService;
  query?: ExportQuery;
}) {
  debug('exportJSONFromQuery()', { ns: toNS(ns) });

  const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
    projection: query.projection,
    sort: query.sort,
    limit: query.limit,
    skip: query.skip,
  });

  const { filename, input, columns } = await loadEJSONFileAndColumns({
    cursor: findCursor,
    abortSignal: exportOptions.abortSignal,
    progressCallback: exportOptions.progressCallback,
  });

  try {
    return await exportCSV({
      ...exportOptions,
      input,
      columns,
    });
  } finally {
    void findCursor.close();
    void fs.promises.rm(filename);
  }
}
