import type { EventEmitter } from 'node:events';

export type EventSource =
  | Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
  | Pick<EventEmitter, 'once' | 'on' | 'off'>;

type Listener = EventListener & ((...args: never[]) => void);

function isEventTarget(
  et: unknown
): et is Pick<EventTarget, 'addEventListener' | 'removeEventListener'> {
  return (
    !!et &&
    typeof et === 'object' &&
    'addEventListener' in et &&
    typeof et.addEventListener === 'function'
  );
}

function addListener(
  es: EventSource,
  event: string,
  listener: Listener,
  { once = false }: { once?: boolean } = {}
) {
  if (isEventTarget(es)) {
    es.addEventListener(event, listener, { once });
    return;
  }

  if (once) {
    es.once(event, listener);
  } else {
    es.on(event, listener);
  }
}

function removeListener(es: EventSource, event: string, listener: Listener) {
  if (isEventTarget(es)) {
    es.removeEventListener(event, listener);
    return;
  }
  es.off(event, listener);
}

/**
 * Adds `listener` and returns a Disposable that removes it, so callers can use
 * `using` or a DisposableStack instead of keeping track of the listener. Works
 * with DOM EventTargets and Node.js-style emitters (EventEmitter, Electron's
 * MessagePortMain and parentPort): `listener` gets the event for the former
 * and the emitted arguments for the latter. With `once`, the listener is
 * removed after it first runs.
 */
export function listen<Args extends unknown[]>(
  es: EventSource,
  event: string,
  listener: (...args: Args) => void,
  { once = false }: { once?: boolean } = {}
): Disposable {
  addListener(es, event, listener as unknown as Listener, { once });
  return {
    [Symbol.dispose]: () =>
      removeListener(es, event, listener as unknown as Listener),
  };
}

function rejectOnAbort(
  signal: AbortSignal | undefined,
  reject: (reason: unknown) => void
) {
  return signal && listen(signal, 'abort', () => reject(signal.reason));
}

/**
 * Resolves with the arguments of the next `event`, like Node.js's
 * `events.once`, for both kinds of target. Rejects if `signal` aborts.
 */
export async function once<Args extends unknown[]>(
  es: EventSource,
  event: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<Args> {
  signal?.throwIfAborted();
  const { promise, resolve, reject } = Promise.withResolvers<Args>();
  using _listener = listen<Args>(es, event, (...args) => resolve(args), {
    once: true,
  });
  using _abort = rejectOnAbort(signal, reject);
  return await promise;
}

/**
 * Resolves with the arguments of the first `event` that `filter` accepts.
 * `filter` may throw to reject instead, e.g. when an error message arrives.
 */
export async function waitUntil<Args extends unknown[] = unknown[]>(
  es: EventSource,
  event: string,
  filter: (...args: Args) => boolean,
  { signal }: { signal?: AbortSignal } = {}
): Promise<Args> {
  signal?.throwIfAborted();
  const { promise, resolve, reject } = Promise.withResolvers<Args>();
  // Stop listening inside the listener: an emitter can emit again before any
  // promise callback runs, and `filter` must not see those events.
  using waiter = listen<Args>(es, event, (...args) => {
    try {
      if (!filter(...args)) return;
      waiter[Symbol.dispose]();
      resolve(args);
    } catch (error) {
      waiter[Symbol.dispose]();
      reject(error);
    }
  });
  using _abort = rejectOnAbort(signal, (error) => {
    waiter[Symbol.dispose]();
    reject(error);
  });
  return await promise;
}

/**
 * The Error behind an `error` event. A DOM ErrorEvent carries it on `.error`;
 * Node-style emitters and libraries like web-worker dispatch the Error itself.
 * Falls back to an Error built from the event's message.
 */
export function errorFromEvent(event: unknown): Error {
  if (event instanceof Error) return event;
  const { error, message } = (event ?? {}) as Partial<ErrorEvent>;
  if (error instanceof Error) return error;
  return new Error(typeof message === 'string' ? message : 'Unknown error');
}
