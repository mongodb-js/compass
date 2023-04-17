import type { Readable } from 'stream';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import type { DataService } from 'mongodb-data-service';
import { SchemaAnalyzer } from 'mongodb-schema';
import type { Document, FindOptions } from 'mongodb';
import toNS from 'mongodb-ns';
import { isInternalFieldPath } from 'hadron-document';

import type { ExportQuery } from './export-types';
import { createDebug } from '../utils/logger';

const debug = createDebug('export-json');

// Array of path components. ie. { foo: { bar: { baz:  1 } } } results in ['foo', 'bar', 'baz']
export type SchemaPath = string[];

// TODO(COMPASS-6720): we should just export all the types from mongodb-schema
// and update them. Or alternatively move schemaToPaths() there.
type BSONSchemaField = {
  name: string;
  path: string;
  bsonType?: string;
  types: BSONSchemaField[];
};

type ArraySchemaType = {
  types: BSONSchemaField[];
};

type DocumentSchemaType = BSONSchemaField & {
  fields: BSONSchemaField[];
  types: BSONSchemaField[];
};

function schemaToPaths(
  fields: BSONSchemaField[],
  parent: string[] = []
): SchemaPath[] {
  const paths: string[][] = [];

  for (const field of fields) {
    const path = [...parent, field.name];
    paths.push(path);

    // Recurse on doc.
    const doc = field.types.find((f) => f.bsonType === 'Document') as
      | DocumentSchemaType
      | undefined;

    if (doc) {
      paths.push(...schemaToPaths(doc.fields, path));
    }

    // Recurse on array.
    const array = field.types.find((f) => f.bsonType === 'Array') as
      | ArraySchemaType
      | undefined;

    if (array) {
      const arrayDoc = array.types.find((f) => f.bsonType === 'Document') as
        | DocumentSchemaType
        | undefined;

      if (arrayDoc) {
        paths.push(...schemaToPaths(arrayDoc.fields, path));
      }
    }
  }

  return paths;
}

type Projection = FindOptions['projection'];

export function createProjectionFromSchemaFields(fields: SchemaPath[]) {
  const projection: Projection = {};

  for (const fieldPath of fields) {
    let current: Document = projection;
    for (const [index, fieldName] of fieldPath.entries()) {
      // Set the projection when it's the last index.
      if (index === fieldPath.length - 1) {
        // If we previously encountered ['foo', 'bar'], then ['foo'] after that,
        // this will override it so you get all of 'foo'. ie. it should be the
        // most inclusive
        current[fieldName] = true;
        break;
      }

      if (!current[fieldName]) {
        current[fieldName] = {};
      }

      // Only descend if we're adding to a {}. Don't try and add on to a true.
      // ie. keep the projection as inclusive as possible. So if we already
      // encountered ['foo'], then ['foo', 'bar'] and ['foo', 'bar', 'baz'] will
      // be ignored.
      if (current[fieldName] === true) {
        break;
      }

      current = current[fieldName];
    }
  }

  return projection;
}

type ProgressCallback = (index: number) => void;

type GatherFieldsOptions = {
  input: Readable;
  abortSignal?: AbortSignal;
  progressCallback?: ProgressCallback;
};

type GatherFieldsResult = {
  docsProcessed: number;
  paths: SchemaPath[];
  aborted: boolean;
};

// You probably want to use gatherFieldsFromQuery() rather
async function _gatherFields({
  input,
  abortSignal,
  progressCallback,
}: GatherFieldsOptions): Promise<GatherFieldsResult> {
  const schemaAnalyzer = new SchemaAnalyzer();

  const result = {
    docsProcessed: 0,
    aborted: false,
  };

  const analyzeStream = new Transform({
    objectMode: true,
    transform: (doc: Document, encoding, callback) => {
      schemaAnalyzer.analyzeDoc(doc);
      result.docsProcessed++;
      progressCallback?.(result.docsProcessed);
      callback();
    },
  });

  try {
    await pipeline(
      [input, analyzeStream],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      result.aborted = true;
    } else {
      throw err;
    }
  }

  // TODO(COMPASS-6720): finalizeSchema() inside schema analyzer replaces the
  // fields object internally with something of a different type. We should fix
  // that by making a different final result object that matches the type we
  // want.
  const fields = (
    (schemaAnalyzer.getResult() as any).fields as BSONSchemaField[]
  ).filter((field) => !isInternalFieldPath(field.path));

  return {
    paths: schemaToPaths(fields),
    ...result,
  };
}

function capLimitToSampleSize(limit?: number, sampleSize?: number) {
  if (limit) {
    if (sampleSize) {
      return Math.min(limit, sampleSize);
    } else {
      return limit;
    }
  } else {
    if (sampleSize) {
      return sampleSize;
    } else {
      return undefined;
    }
  }
}

export async function gatherFieldsFromQuery({
  ns,
  dataService,
  query = { filter: {} },
  sampleSize,
  ...exportOptions
}: Omit<GatherFieldsOptions, 'input'> & {
  ns: string;
  dataService: DataService;
  query?: ExportQuery;
  sampleSize?: number;
}): ReturnType<typeof _gatherFields> {
  debug('gatherFieldsFromQuery()', { ns: toNS(ns) });

  const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
    // At the time of writing the export UI won't use this code if there is a
    // projection, but we might as well pass it along if it is there, then this
    // function can give you the unique set of fields for any find query.
    projection: query.projection,
    sort: query.sort,
    // We optionally sample by setting a limit, but the user could have also
    // specified a limit so we might have to combine them somehow
    limit: capLimitToSampleSize(query.limit, sampleSize),
    skip: query.skip,
  });

  const input = findCursor.stream();

  try {
    return await _gatherFields({
      input,
      ...exportOptions,
    });
  } finally {
    void findCursor.close();
  }
}
