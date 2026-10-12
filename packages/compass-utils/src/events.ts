export type EventSource =
  | Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
  | Pick<NodeJS.EventEmitter, 'once' | 'on' | 'off'>;

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

/**
 * Adds `listener` and returns a Disposable that removes it, so callers can use
 * `using` or a DisposableStack instead of keeping track of the listener. Works
 * with DOM EventTargets and Node.js-style emitters (EventEmitter, Electron's
 * MessagePortMain and parentPort): `listener` gets the event for the former
 * and the emitted arguments for the latter. With `once`, the listener is
 * removed after it first runs.
 */
export function listen<Args extends unknown[]>(
  target: EventSource,
  event: string,
  listener: (...args: Args) => void,
  { once = false }: { once?: boolean } = {}
): Disposable {
  // One untyped handle for both shapes; callers type `listener` themselves
  const handler = listener as unknown as EventListener &
    ((...args: never[]) => void);
  if (isEventTarget(target)) {
    target.addEventListener(event, handler, { once });
    return {
      [Symbol.dispose]: target.removeEventListener.bind(target, event, handler),
    };
  }
  if (once) {
    target.once(event, handler);
  } else {
    target.on(event, handler);
  }
  // `off` also removes a listener added with `once`, which Node.js wraps
  return { [Symbol.dispose]: target.off.bind(target, event, handler) };
}

/**
 * Resolves with the arguments of the next `event` that `filter` accepts (any,
 * if there is no filter), like Node.js's `events.once`, for both kinds of
 * target. Rejects if `filter` throws or `signal` aborts. The listener is
 * removed either way.
 */
export async function onceEvent<Args extends unknown[]>(
  target: EventSource,
  event: string,
  {
    signal,
    filter,
  }: { signal?: AbortSignal; filter?: (...args: Args) => boolean } = {}
): Promise<Args> {
  if (signal?.aborted) {
    throw signal.reason;
  }
  const { promise, resolve, reject } = Promise.withResolvers<Args>();
  const listening = [
    listen(
      target,
      event,
      (...args: Args) => {
        try {
          if (!filter || filter(...args)) resolve(args);
        } catch (error) {
          reject(error);
        }
      },
      // A filtered listener has to stay until an event passes the filter
      { once: !filter }
    ),
  ];
  if (signal) {
    listening.push(listen(signal, 'abort', () => reject(signal.reason)));
  }
  return await promise.finally(() => {
    for (const listener of listening) listener[Symbol.dispose]();
  });
}

/**
 * Resolves with the first non-undefined value `pick` returns for an `event`.
 * `pick` may throw to reject instead, e.g. when an error message arrives.
 */
export async function waitUntil<T, Args extends unknown[] = unknown[]>(
  target: EventSource,
  event: string,
  pick: (...args: Args) => T | undefined,
  options: { signal?: AbortSignal } = {}
): Promise<T> {
  let picked: T | undefined;
  await onceEvent<Args>(target, event, {
    ...options,
    filter: (...args) => (picked = pick(...args)) !== undefined,
  });
  return picked as T;
}
