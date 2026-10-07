/**
 * Boundary types for the file-import APIs.
 *
 * These mirror the shapes `compass-import-export` uses today, with two
 * deliberate differences that make them safe to send over the port:
 *
 *  - Every `Readable`/`Writable` becomes a path. The renderer no longer opens
 *    the file; it names it and the utility process does all the I/O. This is
 *    what removes `fs`, `stream-json` and `papaparse` from the renderer.
 *  - `progressCallback`/`errorCallback` become events (see
 *    `DataServiceEventMap`), since functions can't be structured-cloned.
 *    `AbortSignal` is already handled by the transfer layer.
 *
 * The CSV vocabulary below is duplicated rather than imported:
 * `compass-import-export` depends on `data-service`, so the dependency can't
 * point the other way.
 */

export const supportedDelimiters = [',', '\t', ';', ' '] as const;
export type Delimiter = (typeof supportedDelimiters)[number];

export const supportedLinebreaks = ['\r\n', '\n'] as const;
export type Linebreak = (typeof supportedLinebreaks)[number];

// The subset of BSON types the CSV analyzer can detect.
export const detectableFieldTypes = [
  'int',
  'long',
  'double',
  'boolean',
  'date',
  'string',
  'objectId',
  'uuid',
  'regex',
  'minKey',
  'maxKey',
  'ejson',
  'null',
] as const;
export type CSVDetectableFieldType = (typeof detectableFieldTypes)[number];

// The subset of BSON types the CSV importer can parse into.
export const parsableFieldTypes = [
  ...detectableFieldTypes,
  'binData',
  'md5',
  'timestamp',
  'decimal',
  'number',
  'mixed',
] as const;
export type CSVParsableFieldType = (typeof parsableFieldTypes)[number];

export type CSVFieldTypeInfo = {
  count: number;
  firstRowIndex: number;
  firstColumnIndex: number;
  firstValue: string;
};

export type CSVField = {
  // 'undefined' is an internal marker for ignored empty strings.
  types: Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>;
  columnIndexes: number[];
  detected: CSVParsableFieldType;
};

// ---------------------------------------------------------------------------
// Wizard step 0: does the file exist, and how big is it?
// ---------------------------------------------------------------------------

/**
 * Feeds the file-size readout and the "file is gone" validation in the import
 * modal. Not driver work -- this could equally be a main-process IPC call, but
 * it is grouped here so that the renderer has a single place to ask about the
 * file it is importing.
 */
export type GetImportFileInfoArgs = { filePath: string };

export type GetImportFileInfoResult = {
  exists: boolean;
  /** Bytes, used to drive the progress bar denominator. Absent if missing. */
  size?: number;
};

// ---------------------------------------------------------------------------
// Wizard step 1: what kind of file is this?
// ---------------------------------------------------------------------------

export type GuessFileTypeArgs = { filePath: string };

export type GuessFileTypeResult =
  | { type: 'json' | 'jsonl' | 'unknown' }
  | { type: 'csv'; csvDelimiter: Delimiter; newline: Linebreak };

// ---------------------------------------------------------------------------
// Wizard step 2: which fields does the CSV have, and of what types?
// ---------------------------------------------------------------------------

export type ListCSVFieldsArgs = {
  filePath: string;
  delimiter: Delimiter;
  newline: Linebreak;
};

export type ListCSVFieldsResult = {
  uniqueFields: string[];
  headerFields: string[];
  preview: string[][];
};

export type AnalyzeCSVFieldsArgs = {
  filePath: string;
  delimiter: Delimiter;
  newline: Linebreak;
  ignoreEmptyStrings?: boolean;
  signal?: AbortSignal;
};

export type AnalyzeCSVFieldsResult = {
  totalRows: number;
  aborted: boolean;
  fields: Record<string, CSVField>;
};

/** Emitted while `analyzeCSVFields` runs, in place of its progress callback. */
export type AnalyzeCSVFieldsProgress = {
  bytesProcessed: number;
  docsProcessed: number;
};

// ---------------------------------------------------------------------------
// Wizard step 3: run the import
// ---------------------------------------------------------------------------

export type ImportFromFileArgs = {
  ns: string;
  filePath: string;
  /** Picked by the user, seeded from `guessFileType`. */
  fileType: 'json' | 'jsonl' | 'csv';

  // CSV only, ignored for JSON.
  delimiter?: Delimiter;
  newline?: Linebreak;
  ignoreEmptyStrings?: boolean;
  /**
   * Type to coerce each field to, keyed by field name. Excluded fields are
   * simply absent.
   */
  fields?: Record<string, CSVParsableFieldType>;

  stopOnErrors?: boolean;
  signal?: AbortSignal;
};

export type ImportError = {
  name: string;
  message: string;
  index?: number;
  code?: string | number;
  numErrors?: number;
};

export type ImportFromFileResult = {
  aborted?: boolean;
  docsWritten: number;
  docsProcessed: number;
  docsErrored: number;
  biggestDocSize: number;
  hasUnboundArray: boolean;
  /**
   * The first N errors, for the UI summary. The full set goes to
   * `errorLogFilePath` so that a large failed import doesn't have to cross
   * the port.
   */
  errors: ImportError[];
  /**
   * Where the full error log was written. Derived and created by the utility
   * (it needs `path.join` plus a `mkdir` under the user data folder); the
   * renderer only displays it and offers to open it.
   */
  errorLogFilePath?: string;
};

/** Emitted while `importFromFile` runs, in place of its progress callback. */
export type ImportProgress = {
  bytesProcessed: number;
  docsProcessed: number;
  docsWritten: number;
};
