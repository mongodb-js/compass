import type { AggregateOptions, Document } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import createLogger from '@mongodb-js/compass-logging';
const { log, mongoLogId } = createLogger('compass-aggregations');

import { raceWithAbort, createCancelError } from './cancellable-promise';

const defaultOptions = {
  promoteValues: false,
  allowDiskUse: true,
  bsonRegExp: true
};

export async function aggregatePipeline({
  dataService,
  signal,
  namespace,
  pipeline,
  options = {},
  skip,
  limit
}: {
  dataService: DataService;
  signal: AbortSignal;
  namespace: string;
  pipeline: Document[];
  options?: AggregateOptions;
  skip?: number;
  limit?: number;
}): Promise<Document[]> {
  if (signal.aborted) {
    return Promise.reject(createCancelError());
  }
  const session = dataService.startSession('CRUD');
  const cursor = dataService.aggregate(
    namespace,
    pipeline
      .concat(skip ? [{ $skip: skip }] : [])
      .concat(limit ? [{ $limit: limit }] : []),
    { ...defaultOptions, ...options, session }
  );
  const abort = () => {
    Promise.all([
      cursor.close(),
      dataService.killSessions(session)
    ]).catch((err) => {
      log.warn(
        mongoLogId(1001000105),
        'Aggregations',
        'Attempting to kill the session failed',
        { error: err.message }
      );
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
