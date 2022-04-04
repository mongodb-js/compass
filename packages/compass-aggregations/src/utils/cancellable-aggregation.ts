import type { AggregateOptions, Document } from "mongodb";
import type { DataService } from "mongodb-data-service";
import createLogger from '@mongodb-js/compass-logging';
const { log, mongoLogId } = createLogger('compass-aggregations');

import { raceWithAbort, createCancelError } from './cancellable-promise';

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
  const session = dataService.startSession('CRUD');
  const cursor = dataService.aggregate(namespace, pipeline, options).skip(skip).limit(limit);
  const abort = () => {
    cursor.close();
    dataService.killSessions(session).catch(() => {
      log.warn(mongoLogId(1001000105), 'Aggregations', 'Attempting to kill the session failed')
    });
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