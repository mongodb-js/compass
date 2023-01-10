import type { DataService } from 'mongodb-data-service';

type GuessFileTypeOptions = {
  filename: string;
};

type GuessFileTypeResult = {
  type: 'json' | 'csv';
  // CSV only
  csvDelimiter?: string;
};

export function guessFileType({
  filename,
}: GuessFileTypeOptions): Promise<GuessFileTypeResult> {
  // Steps:
  // 1. guess the type (csv or json)
  // 2. if csv, guess the delimiter

  // TODO
  console.log(filename);
  return Promise.resolve({ type: 'csv', csvDelimeter: ',' });
}

///

type ListCSVFieldsOptions = {
  filename: string;
  delimiter: string;
};

type ListCSVFieldsResult = string[];

export function listCSVFields({
  filename,
  delimiter,
}: ListCSVFieldsOptions): Promise<ListCSVFieldsResult> {
  // Steps:
  // 1. read the first line
  // 2. split by the specified delimiter

  // TODO
  console.log(filename, delimiter);
  return Promise.resolve([]);
}

///

type AnalyzeCSVFieldsOptions = {
  filename: string;
  delimiter: string;
  abortSignal: AbortSignal;
  progressCallback: (index: number) => void;
};

type CSVFieldType = {
  // How many rows in the file matched this type.
  count: number;

  // The line in the file where this field was first detected to be of this
  // type. This is so the field type selector can immediately present that line
  // or document as a counter example if the user selects an incompatible field
  // type.
  firstRowIndex: number;

  // Keep the position that the field name was in the header row so we can
  // easily pull out the data for each row and also so we can later insert the
  // data for each document in the same order it was in the file
  columnIndex?: number;

  // For objects only
  children?: CSVFields;

  // For arrays only
  length?: number;
};

type CSVField = Record<string, CSVFieldType>;

// Each top-level field in the file ie. each one from the CSV header row and the
// superset of all fields in the JSON documents will make up the keys and then
// information about those fields make up the values. This structure then
// recurses through the children property for detected CSV objects and real JSON
// objects. This information is used by the field type selection step to
// preselect the narrowest possible type (ie. auto-detect the field type) and
// also to show a warning if the user picks an incompatible type.
type CSVFields = Record<string, CSVField>;

type AnalyzeCSVFieldsResult = {
  total: number;
  fields: CSVFields;
};

export function analyzeCSVFields({
  filename,
  delimiter,
  abortSignal,
  progressCallback,
}: AnalyzeCSVFieldsOptions): Promise<AnalyzeCSVFieldsResult> {
  // Steps:
  // 1. stream the whole file, counting the docs. Also build up the
  //    analyzed fields object along the way (see importer spike/prototype)

  // TODO
  console.log(filename, delimiter, abortSignal, progressCallback);
  return Promise.resolve({ total: 0, fields: {} });
}

type ImportJSONOptions = {
  dataService: DataService;
  ns: string;
  filename: string;
  abortSignal: AbortSignal;
  progressCallback: (index: number) => void;
  stopOnErrors?: boolean;
};

type ImportJSONResult = Error[];

export function importJSON({
  dataService,
  ns,
  filename,
  abortSignal,
  progressCallback,
  stopOnErrors,
}: ImportJSONOptions): Promise<ImportJSONResult> {
  // walk the file, build each doc, insert

  // TODO: Just silencing TypeScript for now
  console.log(
    dataService,
    ns,
    filename,
    abortSignal,
    progressCallback,
    stopOnErrors
  );
  return Promise.resolve([]);
}

type ImportCSVOptions = {
  dataService: DataService;
  ns: string;
  filename: string;
  abortSignal: AbortSignal;
  progressCallback: (index: number) => void;
  delimiter: string;
  ignoreEmptyStrings?: boolean;
  stopOnErrors?: boolean;
  // pass in the info returned from analyze because all the column indexes,
  // children and lengths will be used again to build the docs to insert
  analyzedFields: CSVFields;
  fields: Record<string, string>; // the type chosen by the user to make each field
};

type ImportCSVResult = Error[];

export function importCSV({
  dataService,
  ns,
  filename,
  abortSignal,
  progressCallback,
  delimiter,
  ignoreEmptyStrings,
  stopOnErrors,
  analyzedFields,
  fields,
}: ImportCSVOptions): Promise<ImportCSVResult> {
  // walk the file, build each doc, insert

  // TODO: Just silencing TypeScript for now
  console.log(
    dataService,
    ns,
    filename,
    abortSignal,
    progressCallback,
    delimiter,
    ignoreEmptyStrings,
    stopOnErrors,
    analyzedFields,
    fields
  );
  return Promise.resolve([]);
}
