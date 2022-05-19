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
  options,
  skip,
  limit
}: {
  dataService: DataService;
  signal: AbortSignal;
  namespace: string;
  pipeline: Document[];
  options: AggregateOptions;
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
    { ...defaultOptions, ...options }
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


/**
 * todo: move to data-service (COMPASS-5808)
 */
export async function explainPipeline({
  dataService,
  signal,
  namespace,
  pipeline,
  options,
  isDataLake,
}: {
  dataService: DataService;
  signal: AbortSignal;
  namespace: string;
  pipeline: Document[];
  options: AggregateOptions;
    isDataLake: boolean;
}): Promise<Document> {
  if (signal.aborted) {
    return Promise.reject(createCancelError());
  }
  const session = dataService.startSession('CRUD');
  const cursor = dataService.aggregate(
    namespace,
    pipeline,
    options
  );
  const abort = () => {
    Promise.all([
      cursor.close(),
      dataService.killSessions(session)
    ]).catch((err) => {
      log.warn(
        mongoLogId(1_001_000_139),
        'Aggregation explain',
        'Attempting to kill the session failed',
        { error: err.message }
      );
    });
  };
  signal.addEventListener('abort', abort, { once: true });
  let result = {};
  try {
    const lastStage = pipeline[pipeline.length - 1] ?? {};
    const isOutOrMergePipeline =
      Object.prototype.hasOwnProperty.call(lastStage, '$out') ||
      Object.prototype.hasOwnProperty.call(lastStage, '$merge');
    const verbosity = isDataLake
      ? 'queryPlannerExtended'
      : isOutOrMergePipeline ? 'queryPlanner' // $out & $merge only work with queryPlanner
        : 'allPlansExecution';
    result = await raceWithAbort(cursor.explain(verbosity), signal);
  } finally {
    signal.removeEventListener('abort', abort);
  }
  return result;
}
