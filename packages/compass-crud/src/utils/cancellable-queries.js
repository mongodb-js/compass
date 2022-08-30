import createLogger from '@mongodb-js/compass-logging';

const { log, mongoLogId, debug } = createLogger('cancellable-queries');

/**
 * The error message to use whenever the user cancels the queries that are in
 * progress.
 */
export const OPERATION_CANCELLED_MESSAGE = 'The operation was cancelled.';

export async function findDocuments(
  dataService,
  ns,
  filter,
  { signal, ...options }
) {
  if (signal.aborted) {
    throw new Error(OPERATION_CANCELLED_MESSAGE);
  }

  const cursor = dataService.fetch(ns, filter, options);

  const abort = () => {
    cursor.close();
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
  dataService,
  ns,
  filter,
  { signal, session, skip, limit, maxTimeMS, hint }
) {
  if (signal.aborted) {
    throw new Error(OPERATION_CANCELLED_MESSAGE);
  }

  const opts = { session, maxTimeMS, hint };

  let $match;
  if (filter && Object.keys(filter).length > 0) {
    // not all find filters are valid $match stages..
    $match = filter;
  } else {
    $match = {};
  }

  const stages = [{ $match }];
  if (skip) {
    stages.push({ $skip: skip });
  }
  if (limit) {
    stages.push({ $limit: limit });
  }
  stages.push({ $count: 'count' });

  // The cursor will be replaced if we try after an error due to the index
  // specified in the hint not existing.
  const cursor = dataService.aggregate(ns, stages, opts);

  const abort = () => {
    cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });

  let result;
  try {
    const array = await raceWithAbort(cursor.toArray(), signal);
    // the collection could be empty
    result = array.length ? array[0].count : 0;
  } catch (err) {
    // rethrow if we aborted along the way
    if (err.message === OPERATION_CANCELLED_MESSAGE) {
      throw err;
    }

    // for all other errors we assume the query failed
    debug('warning: unable to count documents', err);
    // The count queries can frequently time out on large collections.
    // The UI will just have to deal with null.
    result = null;
  }

  signal.removeEventListener('abort', abort);

  return result;
}

export async function fetchShardingKeys(
  dataService,
  ns,
  { signal, session, maxTimeMS }
) {
  // best practise is to first check if the signal wasn't already aborted
  if (signal.aborted) {
    throw new Error(OPERATION_CANCELLED_MESSAGE);
  }

  const cursor = dataService.fetch(
    'config.collections',
    { _id: ns },
    { session, maxTimeMS, projection: { key: 1, _id: 0 } }
  );

  // close the cursor if the operation is aborted
  const abort = () => {
    cursor.close();
  };
  signal.addEventListener('abort', abort, { once: true });

  let configDocs;

  try {
    configDocs = await raceWithAbort(cursor.toArray(), signal);
  } catch (err) {
    // rethrow if we aborted along the way
    if (err.message === OPERATION_CANCELLED_MESSAGE) {
      throw err;
    }

    // for other errors assume that the query failed
    log.warn(
      mongoLogId(1001000075),
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

/*
 * Return a promise you can race (just like a timeout from timeouts/promises).
 * It will reject if abortSignal triggers before successSignal
 */
function abortablePromise(abortSignal, successSignal) {
  let reject;

  const promise = new Promise(function (resolve, _reject) {
    reject = _reject;
  });

  const abort = () => {
    // if this task aborts it will never succeed, so clean up that event listener
    // (abortSignal's event handler is already removed due to { once: true })
    successSignal.removeEventListener('abort', succeed);

    reject(new Error(OPERATION_CANCELLED_MESSAGE));
  };

  const succeed = () => {
    // if this task succeeds it will never abort, so clean up that event listener
    // (successSignal's event handler is already removed due to { once: true })
    abortSignal.removeEventListener('abort', abort);
  };

  abortSignal.addEventListener('abort', abort, { once: true });
  successSignal.addEventListener('abort', succeed, { once: true });

  return promise;
}

/*
 * We need a promise that will reject as soon as the operation is aborted since
 * closing the cursor isn't enough to immediately make the cursor method's
 * promise reject.
 */
async function raceWithAbort(promise, signal) {
  const successController = new AbortController();
  const abortPromise = abortablePromise(signal, successController.signal);
  try {
    return await Promise.race([abortPromise, promise]);
  } finally {
    if (!signal.aborted) {
      // either the operation succeeded or it failed because of some error
      // that's not an abort
      successController.abort();
    }
  }
}
