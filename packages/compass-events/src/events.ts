import type { EventEmitter } from 'node:events';

export type EventSource =
  | Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
  | Pick<EventEmitter, 'once' | 'on' | 'off'>;

type Listener = EventListener & ((...args: never[]) => void);

const EMPTY_DISPOSABLE = { [Symbol.dispose]: () => {} };

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

/**
 * A utility that helps with writing listener code idiomatically
 *
 * @example
 * ```js
 * using listener = addAbortListener(signal, function () {
 *   console.log('aborted', this.reason);
 * });
 * ```
 *
 * @param signal - if exists adds an abort listener
 * @param listener - the listener to be added to signal
 * @returns A disposable that will remove the abort listener
 */
export function addAbortListener(
  signal: AbortSignal | undefined | null,
  listener: (this: AbortSignal, event: Event) => void
): Disposable {
  if (!signal) return EMPTY_DISPOSABLE;
  return listen(signal, 'abort', listener, { once: true });
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
  using _abort = addAbortListener(signal, function () {
    reject(this.reason);
  });
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
  using _abort = addAbortListener(signal, function () {
    waiter[Symbol.dispose]();
    reject(this.reason);
  });
  return await promise;
}

/**
 * Takes a promise and races it with a promise wrapping the abort event of the optionally provided signal.
 * The given promise is _always_ ordered before the signal's abort promise.
 * When given an already rejected promise and an already aborted signal, the promise's rejection takes precedence.
 *
 * Any asynchronous processing in `promise` will continue even after the abort signal has fired,
 * but control will be returned to the caller
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race
 *
 * @param promise - A promise to discard if the signal aborts
 * @param options - An options object carrying an optional signal
 */
export async function abortable<T>(
  promise: Promise<T>,
  { signal }: { signal?: AbortSignal } = {}
): Promise<T> {
  if (!signal) return await promise;
  const { promise: aborted, reject } = Promise.withResolvers<never>();
  if (signal.aborted) reject(signal.reason);
  using _abortListener = addAbortListener(signal, function () {
    reject(this.reason);
  });
  return await Promise.race([promise, aborted]);
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
  return new Error(
    typeof message === 'string' ? message : `Unknown error: ${String(message)}`
  );
}

export async function cancellableWait<T = void>(
  ms: number,
  value?: T,
  options?: { signal?: AbortSignal; ref?: boolean }
): Promise<T> {
  options?.signal?.throwIfAborted();
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  const timeoutId = setTimeout(resolve, ms, value);
  if (options?.ref === false) {
    // Timers are ref-ed by default so check for explicit false.
    // @ts-expect-error: unref is for nodejs, cautiously invoked for browser support.
    timeoutId?.unref?.();
  }
  using _timeout = { [Symbol.dispose]: () => clearTimeout(timeoutId) };
  using _abort = addAbortListener(options?.signal, function () {
    reject(this.reason);
  });
  return await promise;
}
