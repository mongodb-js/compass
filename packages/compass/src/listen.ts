/** Adds `listener` and returns a Disposable that removes it, */
export function listen<Args extends unknown[]>(
  target: EventTarget | Pick<NodeJS.EventEmitter, 'on' | 'off'>,
  event: string,
  listener: (...args: Args) => void
): Disposable {
  // One untyped handle for both shapes; callers type `listener` themselves
  const handler = listener as unknown as EventListener &
    ((...args: never[]) => void);
  if ('addEventListener' in target) {
    target.addEventListener(event, handler);
    return {
      [Symbol.dispose]: target.removeEventListener.bind(target, event, handler),
    };
  }
  target.on(event, handler);
  return { [Symbol.dispose]: target.off.bind(target, event, handler) };
}
