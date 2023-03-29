import { Transform } from 'stream';
import { pipeline } from 'stream/promises';
import { EJSON } from 'bson';
import type { Writable } from 'stream';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import type {
  AggregationCursor,
  AggregateOptions,
  Document,
  FindCursor,
  Sort,
} from 'mongodb';

import { createDebug } from '../utils/logger';

const debug = createDebug('export-json');

export type ExportAggregation = {
  stages: Document[];
  options: AggregateOptions;
};

export type ExportQuery = {
  filter: Document;
  sort?: Sort;
  limit?: number;
  skip?: number;
  projection?: Document;
};

type ExportJSONOptions = {
  dataService: DataService;
  ns: string;
  output: Writable;
  abortSignal?: AbortSignal;
  input: FindCursor | AggregationCursor;
  progressCallback?: (index: number) => void;
  variant: 'default' | 'relaxed' | 'canonical';
};

type ExportJSONResult = {
  docsWritten: number;
  aborted: boolean;
};

function getEJSONOptionsForVariant(
  variant: 'default' | 'relaxed' | 'canonical'
) {
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
  ns,
  output,
  abortSignal,
  input,
  progressCallback,
  variant,
}: ExportJSONOptions): Promise<ExportJSONResult> {
  debug('exportJSON()', { ns: toNS(ns) });

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
        const doc = `${
          (docsWritten > 1 ? ',\n' : '') +
          EJSON.stringify(chunk, ejsonOptions, 2)
        }`;

        debug('transform', doc);
        callback(null, doc);
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

    if (abortSignal?.aborted) {
      void input.close();
    } else {
      output.write(']\n', 'utf8');
    }
  } catch (err: any) {
    if (err.code === 'ABORT_ERR') {
      void input.close();
      return {
        docsWritten,
        aborted: true,
      };
    }

    throw err;
  }

  return {
    docsWritten,
    aborted: !!abortSignal?.aborted,
  };
}

export async function exportJSONFromAggregation(
  options: Omit<ExportJSONOptions, 'input'> & {
    aggregation: ExportAggregation;
  }
) {
  const { dataService, ns, aggregation } = options;

  const { stages, options: aggregationOptions } = aggregation;
  aggregationOptions.maxTimeMS = capMaxTimeMSAtPreferenceLimit(
    aggregationOptions.maxTimeMS
  );
  const aggregationCursor = dataService.aggregateCursor(
    ns,
    stages,
    aggregationOptions
  );

  return await exportJSON({
    ...options,
    input: aggregationCursor,
  });
}

export async function exportJSONFromQuery(
  options: Omit<ExportJSONOptions, 'input'> & {
    query?: ExportQuery;
  }
) {
  const { dataService, ns, query = { filter: {} } } = options;

  const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
    projection: query.projection,
    sort: query.sort,
    limit: query.limit,
    skip: query.skip,
  });

  return await exportJSON({
    ...options,
    input: findCursor,
  });
}
