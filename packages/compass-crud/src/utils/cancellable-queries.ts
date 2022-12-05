import createLogger from '@mongodb-js/compass-logging';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import type { DataService } from 'mongodb-data-service';
import type { BSONObject } from '../stores/crud-store';
import { createCancelError, raceWithAbort } from '@mongodb-js/compass-utils';

const { log, mongoLogId, debug } = createLogger('cancellable-queries');

export async function findDocuments(
  dataService: DataService,
  ns: string,
  filter: BSONObject,
  {
    signal,
    ...options
  }: {
    signal: AbortSignal;
  } & Omit<Parameters<typeof dataService.fetch>[2], 'sort'>
): Promise<BSONObject[]> {
  if (signal.aborted) {
    throw signal.reason ?? createCancelError();
  }

  const cursor = dataService.fetch(ns, filter, options);

  const abort = () => {
    void cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });

  let result;
  try {
    result = await raceWithAbort(cursor.toArray(), signal);
  } finally {
    signal.removeEventListener('abort', abort);
  }

  return result;
}

export async function countDocuments(
  dataService: DataService,
  ns: string,
  filter: BSONObject,
  {
    signal,
    session,
    skip,
    limit,
    maxTimeMS,
    hint,
  }: { signal: AbortSignal; skip?: number; limit?: number } & Parameters<
    typeof dataService.aggregate
  >[2]
): Promise<number> {
  const opts = {
    session,
    maxTimeMS: capMaxTimeMSAtPreferenceLimit(maxTimeMS),
    hint,
  };

  let $match: BSONObject;
  if (filter && Object.keys(filter).length > 0) {
    // not all find filters are valid $match stages..
    $match = filter;
  } else {
    $match = {};
  }

  const stages: BSONObject[] = [{ $match }];
  if (skip) {
    stages.push({ $skip: skip });
  }
  if (limit) {
    stages.push({ $limit: limit });
  }
  stages.push({ $count: 'count' });

  let result;
  try {
    const array = await dataService.aggregate(ns, stages, opts, {
      abortSignal: signal,
    });
    // the collection could be empty
    result = array.length ? array[0].count : 0;
  } catch (err: any) {
    // rethrow if we aborted along the way
    if (dataService.isCancelError(err)) {
      throw err;
    }

    // for all other errors we assume the query failed
    debug('warning: unable to count documents', err);
    // The count queries can frequently time out on large collections.
    // The UI will just have to deal with null.
    result = null;
  }
  return result;
}

export async function fetchShardingKeys(
  dataService: DataService,
  ns: string,
  {
    signal,
    session,
    maxTimeMS,
  }: {
    signal: AbortSignal;
  } & Parameters<typeof dataService.fetch>[2]
): Promise<BSONObject> {
  // best practise is to first check if the signal wasn't already aborted
  if (signal.aborted) {
    throw signal.reason ?? createCancelError();
  }

  const cursor = dataService.fetch(
    'config.collections',
    { _id: ns },
    { session, maxTimeMS, projection: { key: 1, _id: 0 } }
  );

  // close the cursor if the operation is aborted
  const abort = () => {
    void cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });

  let configDocs;

  try {
    configDocs = await raceWithAbort(cursor.toArray(), signal);
  } catch (err: any) {
    // rethrow if we aborted along the way
    if (dataService.isCancelError(err)) {
      throw err;
    }

    // for other errors assume that the query failed
    log.warn(
      mongoLogId(1_001_000_075),
      'Documents',
      'Failed to fetch sharding keys',
      err
    );
    configDocs = [];
  }

  // clean up event handlers because we succeeded
  signal.removeEventListener('abort', abort);

  return configDocs.length ? configDocs[0].key : {};
}
