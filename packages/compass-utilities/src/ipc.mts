import { listen, type EventSource } from '@mongodb-js/compass-utils';

/**
 * What a utility talks to its host through: Electron's `process.parentPort`
 * in Compass, the worker's global scope in Compass Web. Both emit `message`
 * events carrying `ports` and accept `postMessage`.
 */
export type UtilityParentPort = EventSource & {
  postMessage(message: unknown): void;
};

/**
 * The parent port of the process or worker this code runs in, or `undefined`
 * when it runs anywhere else (e.g. imported by a test), so a utility only
 * starts when it is the entry point.
 */
export function currentParentPort(): UtilityParentPort | undefined {
  if (process.parentPort) return process.parentPort;
  if ('WorkerGlobalScope' in globalThis) return globalThis;
  return undefined;
}

/**
 * The host hands a utility its MessagePorts over `parentPort`, one per renderer
 * (or other peer) that wants to talk to it. `handler` attaches its listeners
 * before the port is started, so no message posted ahead of time is dropped.
 *
 * In Compass the port is really Electron's `MessagePortMain`, which only shares
 * `postMessage`, `start` and `close` with a DOM `MessagePort`: reach its events
 * through `listen` and friends, never `.on` or `.addEventListener`.
 */
export function onPort(
  parentPort: UtilityParentPort,
  handler: (port: MessagePort) => void
): Disposable {
  return listen(
    parentPort,
    'message',
    ({ ports }: { ports: readonly MessagePort[] }) => {
      for (const port of ports) {
        handler(port);
        port.start();
      }
    }
  );
}
