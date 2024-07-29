import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { EJSON } from 'bson';
import type { Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { AggregationCursor, FindCursor } from 'mongodb';
import { objectToIdiomaticEJSON } from 'hadron-document';

import type {
  ExportAggregation,
  ExportQuery,
  ExportResult,
} from './export-types';
import { createDebug } from '../utils/logger';
import { createAggregationCursor, createFindCursor } from './export-cursor';

const debug = createDebug('export-json');

export type ExportJSONFormat = 'default' | 'relaxed' | 'canonical';

type ExportJSONOptions = {
  output: Writable;
  abortSignal?: AbortSignal;
  input: FindCursor | AggregationCursor;
  progressCallback?: (index: number) => void;
  variant: ExportJSONFormat;
};

function getEJSONOptionsForVariant(variant: ExportJSONFormat) {
  if (variant === 'relaxed') {
    return {
      relaxed: true,
    };
  }
  return variant === 'canonical'
    ? {
        relaxed: false, // canonical
      }
    : undefined; // default
}

export async function exportJSON({
  output,
  abortSignal,
  input,
  progressCallback,
  variant,
}: ExportJSONOptions): Promise<ExportResult> {
  let docsWritten = 0;

  const ejsonOptions = getEJSONOptionsForVariant(variant);

  if (!abortSignal?.aborted) {
    output.write('[');
  }

  const docStream = new Transform({
    objectMode: true,
    transform: function (chunk: any, encoding, callback) {
      // NOTE: This count is used as the final documents written count,
      // however it does not, at this point, represent the count of documents
      // written to the file as this is an earlier point in the pipeline.
      ++docsWritten;
      progressCallback?.(docsWritten);
      try {
        const doc: string =
          variant === 'default'
            ? objectToIdiomaticEJSON(chunk, { indent: 2 })
            : EJSON.stringify(chunk, undefined, 2, ejsonOptions);
        const line = `${docsWritten > 1 ? ',\n' : ''}${doc}`;

        callback(null, line);
      } catch (err: any) {
        callback(err);
      }
    },
    final: function (callback) {
      this.push(']');
      callback(null);
    },
  });

  try {
    const inputStream = input.stream();
    await pipeline(
      [inputStream, docStream, output],
      ...(abortSignal ? [{ signal: abortSignal }] : [])
    );
    output.write(']\n', 'utf8');
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      // Finish the JSON file as the `final` of the docs stream didn't run.
      output.write(']\n', 'utf8');

      return {
        docsWritten,
        aborted: true,
      };
    }
    output.write(']\n', 'utf8');

    throw err;
  } finally {
    void input.close();
  }

  return {
    docsWritten,
    aborted: !!abortSignal?.aborted,
  };
}

export async function exportJSONFromAggregation({
  ns,
  aggregation,
  dataService,
  preferences,
  ...exportOptions
}: Omit<ExportJSONOptions, 'input'> & {
  ns: string;
  dataService: Pick<DataService, 'aggregateCursor'>;
  preferences: PreferencesAccess;
  aggregation: ExportAggregation;
}) {
  debug('exportJSONFromAggregation()', { ns: toNS(ns), aggregation });

  const aggregationCursor = createAggregationCursor({
    ns,
    aggregation,
    dataService,
    preferences,
  });

  return await exportJSON({
    ...exportOptions,
    input: aggregationCursor,
  });
}

export async function exportJSONFromQuery({
  ns,
  query = { filter: {} },
  dataService,
  ...exportOptions
}: Omit<ExportJSONOptions, 'input'> & {
  ns: string;
  dataService: Pick<DataService, 'findCursor'>;
  query?: ExportQuery;
}) {
  debug('exportJSONFromQuery()', { ns: toNS(ns), query });

  const findCursor = createFindCursor({
    ns,
    query,
    dataService,
  });

  return await exportJSON({
    ...exportOptions,
    input: findCursor,
  });
}
