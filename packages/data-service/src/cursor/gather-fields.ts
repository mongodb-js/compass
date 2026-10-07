import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { SchemaAnalyzer } from '@mongodb-js/mongodb-schema';
import { isInternalFieldPath } from 'hadron-document';
import type { Document, Filter, FindOptions, Sort } from 'mongodb';
import type { CollationOptions } from 'mongodb';
import type { DataService } from '../data-service';

// The shape of the find query the exporter used. Kept here (rather than
// importing from compass-import-export) so data-service stays the single owner
// of cursor-side logic.
export type GatherFieldsQuery = {
  filter?: Filter<Document>;
  sort?: Sort;
  limit?: number;
  skip?: number;
  projection?: Document;
  collation?: CollationOptions;
};

export type GatherFieldsArgs = {
  ns: string;
  query?: GatherFieldsQuery;
  sampleSize?: number;
  signal?: AbortSignal;
};

// Array of path components. ie. { foo: { bar: { baz:  1 } } } results in ['foo', 'bar', 'baz']
export type SchemaPath = string[];

type Projection = FindOptions['projection'];

export function createProjectionFromSchemaFields(fields: SchemaPath[]) {
  const projection: Projection = {};

  for (const fieldPath of fields) {
    let current: Document = projection;
    for (const [index, fieldName] of fieldPath.entries()) {
      if (index === fieldPath.length - 1) {
        current[fieldName] = 1;
        break;
      }

      if (!current[fieldName]) {
        current[fieldName] = {};
      }

      if (current[fieldName] === 1) {
        break;
      }

      current = current[fieldName];
    }
  }

  if (projection._id === undefined) {
    projection._id = 0;
  }

  return projection;
}

export type GatherFieldsResult = {
  docsProcessed: number;
  paths: SchemaPath[];
  aborted: boolean;
};

export async function gatherFields(
  dataService: Pick<DataService, 'findCursor'>,
  { ns, query = {}, sampleSize, signal }: GatherFieldsArgs
): Promise<GatherFieldsResult> {
  const limit =
    query.limit !== undefined
      ? Math.min(query.limit, sampleSize ?? Number.MAX_SAFE_INTEGER)
      : sampleSize;

  const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
    projection: query.projection,
    sort: query.sort,
    limit,
    skip: query.skip,
    collation: query.collation,
    promoteValues: false,
    bsonRegExp: true,
  });

  const input = findCursor.stream();
  const schemaAnalyzer = new SchemaAnalyzer();
  const result = { docsProcessed: 0, aborted: false };

  const analyzeStream = new Transform({
    objectMode: true,
    transform: (doc: Document, _encoding, callback) => {
      schemaAnalyzer
        .analyzeDoc(doc)
        .then(() => {
          result.docsProcessed++;
          callback();
        })
        .catch(callback);
    },
  });

  try {
    await pipeline([input, analyzeStream], ...(signal ? [{ signal }] : []));
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'ABORT_ERR') {
      result.aborted = true;
    } else {
      throw err;
    }
  } finally {
    void findCursor.close();
  }

  const paths = schemaAnalyzer
    .getSchemaPaths()
    .filter((fieldPaths: string[]) => !isInternalFieldPath(fieldPaths[0]));

  return {
    paths,
    ...result,
  };
}
