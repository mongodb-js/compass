export const OPERATION_CANCELLED_ERROR = 'OperationCancelledError';

const OPERATION_CANCELLED_MESSAGE = 'The operation was cancelled.';

export class PromiseCancelledError extends Error {
  name = OPERATION_CANCELLED_ERROR;
  constructor() {
    super(OPERATION_CANCELLED_MESSAGE);
  }
}

/*
 * Return a promise you can race (just like a timeout from timeouts/promises).
 * It will reject if abortSignal triggers before successSignal
 */
function abortablePromise(
  abortSignal: AbortSignal,
  successSignal: AbortSignal
) {
  if (abortSignal.aborted) {
    return Promise.reject(new PromiseCancelledError());
  }

  let reject: (reason: unknown) => void;

  const promise = new Promise<never>(function (_resolve, _reject) {
    reject = _reject;
  });

  const abort = () => {
    // if this task aborts it will never succeed, so clean up that event listener
    // (abortSignal's event handler is already removed due to { once: true })
    successSignal.removeEventListener('abort', succeed);

    reject(new PromiseCancelledError());
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
 * We need a promise that will reject as soon as the operation is aborted.
 */
export async function raceWithAbort<T>(
  promise: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  if (signal.aborted) {
    return Promise.reject(new PromiseCancelledError());
  }
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
