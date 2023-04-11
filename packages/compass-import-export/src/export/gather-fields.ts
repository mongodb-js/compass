import type { DataService } from 'mongodb-data-service';
import mongodbSchema from 'mongodb-schema';
import type { SchemaField } from 'mongodb-schema';
import { isInternalFieldPath } from 'hadron-document';
import type { Document } from 'mongodb';

import { createDebug } from '../utils/logger';

const debug = createDebug('export-json');

type AnalyzeSchemaOptions = {
  dataService: DataService;
  ns: string;
  abortSignal?: AbortSignal;
  filter?: Document;
  sampleSize: number;
};

async function analyzeSchema({
  dataService,
  ns,
  abortSignal,
  filter,
  sampleSize,
}: AnalyzeSchemaOptions) {
  try {
    // TODO(COMPASS-6426): Should we use the other aspects of the query in this sample. (project/sort/limit/skip)
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
    const schemaData = await mongodbSchema(docs);
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
  abortSignal?: AbortSignal;
  filter?: Document;
  progressCallback?: (index: number) => void;
  sampleSize: number;
};

// Array of path components. ie. { foo: { bar: { baz:  1 } } } results in ['foo', 'bar', 'baz']
export type SchemaPath = string[];

function schemaToPaths(
  fields: SchemaField[],
  parent: string[] = []
): SchemaPath[] {
  const paths: string[][] = [];

  for (const field of fields) {
    const path = [...parent, field.name];
    paths.push(path);

    // Recurse on doc.
    const doc = field.types.find(
      (f) =>
        (
          f as unknown as {
            bsonType: string;
          }
        ).bsonType === 'Document'
    );
    if (doc) {
      paths.push(
        ...schemaToPaths(((doc as any).fields ?? []) as SchemaField[], path)
      );
    }

    // Recurse on array.
    const array = field.types.find(
      (f) =>
        (
          f as unknown as {
            bsonType: string;
          }
        ).bsonType === 'Array'
    );
    if (array) {
      const arrayDoc = (array as any).types.find(
        (f: { bsonType?: string }) => f.bsonType === 'Document'
      );
      if (arrayDoc) {
        paths.push(...schemaToPaths(arrayDoc.fields ?? [], path));
      }
    }
  }

  return paths;
}

type Projection = {
  [field: string]: boolean | Projection;
};

export function createProjectionFromSchemaFields(fields: SchemaPath[]) {
  const projection: Projection = {};

  for (const fieldPath of fields) {
    let current = projection;
    for (const [index, fieldName] of fieldPath.entries()) {
      // Set the projection when it's the last index.
      if (index === fieldPath.length) {
        current[fieldName] = true;
        break;
      }

      if (!current[fieldName]) {
        current[fieldName] = {};
      }

      current = current[fieldName] as Projection;
    }
  }

  return projection;
}

// TODO(COMPASS-6426): We will fill out the rest of this function and
// start using the progress callback.
export async function gatherFields({
  dataService,
  ns,
  abortSignal,
  filter,
  // progressCallback, // TODO(COMPASS-6426)
  sampleSize,
}: GatherFieldsOptions): Promise<SchemaPath[]> {
  const schema = await analyzeSchema({
    dataService,
    abortSignal,
    ns,
    filter,
    sampleSize,
  });

  const paths = schemaToPaths(schema?.fields ?? []);

  return paths;
}
