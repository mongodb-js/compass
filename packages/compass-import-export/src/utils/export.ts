import type { WriteStream } from 'fs';
import type { DataService } from 'mongodb-data-service';
import type { TypeCastMap } from 'hadron-type-checker';
export type BSONObject = TypeCastMap['Object'];

type GatherFieldsOptions = {
  dataService: DataService;
  ns: string;
  abortSignal: AbortSignal;
  filter?: BSONObject;
  progressCallback: (index: number) => void;
  sampleSize: number;
};

// array of path components. ie. { foo: { bar: { baz:  1 } } } results in ['foo', 'bar', 'baz']
type SchemaPath = string[];

export function gatherFields({
  dataService,
  ns,
  abortSignal,
  filter,
  progressCallback,
  sampleSize,
}: GatherFieldsOptions): Promise<SchemaPath[]> {

  // TODO
  console.log(dataService, ns, abortSignal, filter, progressCallback, sampleSize);
  return Promise.resolve([]);
}

type ExportJSONOptions = {
  dataService: DataService;
  ns: string;
  output: WriteStream;
  abortSignal: AbortSignal;
  filter?: BSONObject;
  progressCallback: (index: number) => void;
  variant: 'default' | 'relaxed' | 'canonical';
  fields?: SchemaPath[];
};

export function exportJSON({
  dataService,
  ns,
  output,
  abortSignal,
  filter,
  progressCallback,
  variant,
  fields,
}: ExportJSONOptions): Promise<void> {
  // stream through the docs and write the specified fields

  // TODO
  console.log(dataService, ns, output, abortSignal, filter, progressCallback, variant, fields);
  return Promise.resolve();
}

type ExportCSVOptions = {
  dataService: DataService;
  ns: string;
  output: WriteStream;
  abortSignal: AbortSignal;
  filter?: BSONObject;
  progressCallback: (index: number) => void;
  fields?: SchemaPath[];
};

export function exportCSV({
  dataService,
  ns,
  output,
  abortSignal,
  filter,
  progressCallback,
  fields,
}: ExportCSVOptions): Promise<void> {
  // stream through the docs and write the specified fields

  // TODO
  console.log(dataService, ns, output, abortSignal, filter, progressCallback, fields);
  return Promise.resolve();
}
