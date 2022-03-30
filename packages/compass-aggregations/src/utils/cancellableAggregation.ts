import type { AggregateOptions, Document } from "mongodb";
import type { DataService } from "mongodb-data-service";

import { raceWithAbort, createCancelError } from './cancellablePromise';

export async function aggregatePipeline(
  dataService: DataService,
  signal: AbortSignal,
  namespace: string,
  pipeline: Document[],
  options: AggregateOptions,
  skip: number,
  limit: number,
): Promise<Document[]> {
  if (signal.aborted) {
    return Promise.reject(createCancelError());
  }
  const cursor = dataService.aggregate(namespace, pipeline, options).skip(skip).limit(limit);
  const abort = () => {
    cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });
  let result;
  try {
    result = await raceWithAbort(cursor.toArray(), signal);
  } finally {
    signal.removeEventListener('abort', abort);
    result = result || [];
  }

  return result;
}