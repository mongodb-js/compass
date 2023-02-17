import type { DataService } from 'mongodb-data-service';
import type { TypeCastMap } from 'hadron-type-checker';
import mongodbSchema from 'mongodb-schema';
import { isInternalFieldPath } from 'hadron-document';
import { promisify } from 'util';

import { createDebug } from '../utils/logger';

const debug = createDebug('export-json');

type BSONObject = TypeCastMap['Object'];

type AnalyzeShemaOptions = {
  dataService: DataService;
  ns: string;
  abortSignal: AbortSignal;
  filter?: BSONObject;
  sampleSize: number;
};

async function analyzeSchema({
  dataService,
  ns,
  abortSignal,
  filter,
  sampleSize,
}: AnalyzeShemaOptions) {
  try {
    const docs = await dataService.sample(
      ns,
      {
        query: filter,
        ...(sampleSize
          ? {
              size: sampleSize,
            }
          : {}),
      },
      {
        promoteValues: false,
      },
      {
        abortSignal,
      }
    );
    const analyzeDocuments = promisify(mongodbSchema);
    const schemaData = await analyzeDocuments(docs);
    schemaData.fields = schemaData.fields.filter(
      ({ path }: { path: string }) => !isInternalFieldPath(path)
    );

    return schemaData;
  } catch (err) {
    if (dataService.isCancelError(err)) {
      debug('caught background operation terminated error', err);
      return null;
    }

    debug('schema analysis failed', err);
    throw err;
  }
}

type GatherFieldsOptions = {
  dataService: DataService;
  ns: string;
  abortSignal: AbortSignal;
  filter?: BSONObject;
  progressCallback: (index: number) => void;
  sampleSize: number;
};

// Array of path components. ie. { foo: { bar: { baz:  1 } } } results in ['foo', 'bar', 'baz']
export type SchemaPath = string[];

// See https://github.com/mongodb-js/mongodb-schema for more information on
// the types returned by the schema analysis. Once that's in typescript we
// can update this to use those types.
export type SchemaFieldType = {
  name: string;
  path: string;
  probability: number;
  types: (SchemaFieldType & {
    bsonType: string;
  })[];
  fields?: SchemaFieldType[];
  values?: any[];
  count?: number;
  has_duplicates?: boolean;
  lengths?: number[];
  average_length?: number;
  total_count?: number;
};

function schemaToPaths(
  fields: SchemaFieldType[],
  parent: string[] = []
): SchemaPath[] {
  const paths: string[][] = [];

  for (const field of fields) {
    const path = [...parent, field.name];
    paths.push(path);

    // Recurse on doc.
    const doc = field.types.find((f) => f.bsonType === 'Document');
    if (doc) {
      paths.push(...schemaToPaths(doc.fields ?? [], path));
    }

    // Recurse on array.
    const array = field.types.find((f) => f.bsonType === 'Array');
    if (array) {
      const arrayDoc = array.types.find((f) => f.bsonType === 'Document');
      if (arrayDoc) {
        paths.push(...schemaToPaths(arrayDoc.fields ?? [], path));
      }
    }
  }

  return paths;
}

// TODO: In COMPASS-6426
export async function gatherFields({
  dataService,
  ns,
  abortSignal,
  filter,
  progressCallback,
  sampleSize,
}: GatherFieldsOptions): Promise<SchemaPath[]> {
  const schema = await analyzeSchema({
    dataService,
    abortSignal,
    ns,
    filter,
    sampleSize,
  });

  console.log(
    dataService,
    ns,
    abortSignal,
    filter,
    progressCallback,
    sampleSize
  );

  // console.dir(schema, { depth: Infinity });

  const paths = schemaToPaths(schema.fields);

  return paths;
}
