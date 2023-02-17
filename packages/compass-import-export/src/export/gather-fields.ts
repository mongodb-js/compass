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
export type SchemaPath = string[];

export function gatherFields({
  dataService,
  ns,
  abortSignal,
  filter,
  progressCallback,
  sampleSize,
}: GatherFieldsOptions): Promise<SchemaPath[]> {
  // TODO
  console.log(
    dataService,
    ns,
    abortSignal,
    filter,
    progressCallback,
    sampleSize
  );
  return Promise.resolve([]);
}
