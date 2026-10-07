import fs from 'fs';
import { EJSON } from 'bson';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { objectToIdiomaticEJSON } from 'hadron-document';
import type { AggregateOptions, Document, Filter, Sort } from 'mongodb';
import type { CollationOptions } from 'mongodb';
import type { DataService } from '../data-service';
import type { SchemaPath } from './gather-fields';

/** The find query that produces the rows to export. */
export type ExportToFileQuery = {
  filter?: Filter<Document>;
  sort?: Sort;
  limit?: number;
  skip?: number;
  projection?: Document;
  collation?: CollationOptions;
};

export type ExportToFileAggregation = {
  stages: Document[];
  options?: AggregateOptions;
};

export type ExportToFileArgs = {
  ns: string;
  /** Where to write the file. Lives in the utility/Node process on purpose. */
  outputPath: string;
  format: 'json' | 'csv';
  jsonVariant?: 'default' | 'relaxed' | 'canonical';
  find?: ExportToFileQuery;
  aggregation?: ExportToFileAggregation;
  signal?: AbortSignal;
};

export type ExportToFileResult = {
  docsWritten: number;
  aborted: boolean;
};

function getEJSONOptionsForVariant(
  variant?: ExportToFileArgs['jsonVariant']
): { relaxed: boolean } | undefined {
  if (variant === 'relaxed') {
    return { relaxed: true };
  }
  if (variant === 'canonical') {
    return { relaxed: false };
  }
  return undefined;
}

function createCursor(
  dataService: DataService,
  {
    ns,
    find,
    aggregation,
  }: Pick<ExportToFileArgs, 'ns' | 'find' | 'aggregation'>
) {
  if (aggregation) {
    const { stages, options = {} } = aggregation;
    return dataService.aggregateCursor(ns, stages, {
      ...options,
      promoteValues: false,
      bsonRegExp: true,
    });
  }
  return dataService.findCursor(ns, find?.filter ?? {}, {
    projection: find?.projection,
    sort: find?.sort,
    limit: find?.limit,
    skip: find?.skip,
    collation: find?.collation,
    promoteValues: false,
    bsonRegExp: true,
  });
}

/**
 * Runs the cursor to completion and writes the documents to `outputPath` in the
 * requested format, using fs/streams here (in the Node/utility process) so the
 * renderer only learns whether it finished.
 */
export async function exportToFile(
  dataService: DataService,
  {
    ns,
    outputPath,
    format,
    jsonVariant = 'default',
    find,
    aggregation,
    signal,
  }: ExportToFileArgs
): Promise<ExportToFileResult> {
  const cursor = createCursor(dataService, { ns, find, aggregation });
  const output = fs.createWriteStream(outputPath);
  let docsWritten = 0;
  let aborted = false;

  const columns: Set<string>[] = [];

  const jsonTransform = new Transform({
    objectMode: true,
    transform: (chunk: Document, _encoding, callback) => {
      try {
        const line = jsonLineForVariant(chunk, jsonVariant, ++docsWritten);
        callback(null, line);
      } catch (err) {
        callback(err as Error);
      }
    },
  });

  try {
    const input = cursor.stream();
    if (format === 'csv') {
      // CSV columns aren't known until rows arrive, so buffer rows first (this
      // keeps the cursor-side logic here, off the renderer).
      const rows: Document[] = [];
      await pipeline(
        [
          input,
          new Transform({
            objectMode: true,
            transform: (doc: Document, _enc, cb) => {
              rows.push(doc);
              collectColumns(doc, columns);
              cb();
            },
          }),
        ],
        ...(signal ? [{ signal }] : [])
      );
      await writeCsv(output, rows, columns);
      docsWritten = rows.length;
    } else {
      output.write('[');
      await pipeline(
        [input, jsonTransform, output],
        ...(signal ? [{ signal }] : [])
      );
      output.write(']\n');
    }
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'ABORT_ERR') {
      aborted = true;
    } else {
      throw err;
    }
  } finally {
    output.end();
    void cursor.close();
  }

  return { docsWritten, aborted };
}

function jsonLineForVariant(
  doc: Document,
  variant: ExportToFileArgs['jsonVariant'],
  index: number
): string {
  const ejsonOptions = getEJSONOptionsForVariant(variant);
  const serialized =
    variant === 'default'
      ? objectToIdiomaticEJSON(doc, { indent: 2 })
      : EJSON.stringify(doc, undefined, 2, ejsonOptions);
  const separator = index > 1 ? ',\n' : '';
  return `${separator}${serialized}`;
}

function valueForPath(doc: Document, path: string[]): unknown {
  let current: unknown = doc;
  for (const segment of path) {
    if (
      current === null ||
      typeof current !== 'object' ||
      !(segment in (current as Record<string, unknown>))
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function collectColumns(doc: Document, columns: Set<string>[]): void {
  const seen = new Set<string>();
  for (const path of schemaPaths(doc)) {
    const joined = path.join('.');
    if (seen.has(joined)) continue;
    seen.add(joined);
    columns.push(new Set(path));
  }
}

function schemaPaths(doc: Document): SchemaPath[] {
  const paths: SchemaPath[] = [];
  const walk = (value: unknown, prefix: SchemaPath) => {
    if (value === null || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      if (value.length > 0) walk(value[0], prefix);
      return;
    }
    for (const [key, child] of Object.entries(
      value as Record<string, unknown>
    )) {
      const path = [...prefix, key];
      paths.push(path);
      walk(child, path);
    }
  };
  walk(doc, []);
  return paths;
}

function writeCsv(
  output: fs.WriteStream,
  rows: Document[],
  columns: Set<string>[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const header = columns.map((c) => csvEscape([...c].join('.'))).join(',');
    output.write(`${header}\n`);
    for (const row of rows) {
      const line = columns
        .map((c) => csvEscape(formatCell(valueForPath(row, [...c]))))
        .join(',');
      output.write(`${line}\n`);
    }
    output.end();
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

function formatCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object')
    return EJSON.stringify(value, { relaxed: true });
  return String(value);
}
