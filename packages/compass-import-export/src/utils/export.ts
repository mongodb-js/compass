import type { DataService } from 'mongodb-data-service';
import type { TypeCastMap } from 'hadron-type-checker';
export type BSONObject = TypeCastMap['Object'];

type AnalyzeOptions = {
  dataService: DataService,
  ns: string,
  abortSignal: AbortSignal,
  filter?: BSONObject,
  progressCallback: (index: number) => void,
  sampleSize: number
};

// array of path components. ie. { foo: { bar: { baz:  1 } } } results in ['foo', 'bar', 'baz']
type Path = string[];

export function analyze({
  dataService,
  ns,
  abortSignal,
  filter,
  progressCallback,
  sampleSize,
}: AnalyzeOptions): Promise<Path[]> {
  // TODO
}

type ExportJSONOptions = {
  dataService: DataService,
  ns: string,
  filename: string,
  abortSignal: AbortSignal,
  filter?: BSONObject,
  progressCallback: (index: number) => void,
  variant: 'default'|'relaxed'|'canonical',
  fields?: Path[],
};

export function exportJSON({
  dataService,
  ns,
  filename,
  abortSignal,
  filter,
  progressCallback,
  variant,
  fields,
}: ExportJSONOptions): Promise<void> {
  // stream through the docs and write the specified fields
  // TODO
}

type ExportCSVOptions = {
  dataService: DataService,
  ns: string,
  filename: string,
  abortSignal: AbortSignal,
  filter?: BSONObject,
  progressCallback: (index: number) => void,
  fields?: Path[],
};

export function exportCSV({
  dataService,
  ns,
  filename,
  abortSignal,
  filter,
  progressCallback,
  fields,
}: ExportCSVOptions): Promise<void> {
  // stream through the docs and write the specified fields
  // TODO
}
