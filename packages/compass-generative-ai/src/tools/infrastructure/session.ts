import { listen } from '@mongodb-js/compass-events';
import { isToolsRpcMessage } from './protocol';
import type { ToolsRpcMethod, ToolsRpcResponse } from './protocol';

/**
 * Utility-side server. `port` is a `MessagePort` received through
 * `onPort` (already started). Each request gets its own AbortController;
 * abort messages for that id abort it.
 */
export function serveToolsRequests(
  port: MessagePort,
  handler: (
    method: ToolsRpcMethod,
    params: unknown,
    signal: AbortSignal
  ) => Promise<unknown>
): Disposable {
  const controllers = new Map<number, AbortController>();

  const stopListening = listen(port, 'message', (event: { data: unknown }) => {
    const message = event.data;
    if (!isToolsRpcMessage(message)) return;

    if (message.kind === 'abort') {
      controllers.get(message.id)?.abort();
      return;
    }

    if (message.kind !== 'request') return;

    const controller = new AbortController();

    controllers.set(message.id, controller);

    handler(message.method, message.params, controller.signal)
      .then((result) => {
        port.postMessage({
          kind: 'response',
          id: message.id,
          ok: true,
          result,
        } satisfies ToolsRpcResponse);
      })
      .catch((error: unknown) => {
        port.postMessage({
          kind: 'response',
          id: message.id,
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : String((error as any)?.message ?? error),
        } satisfies ToolsRpcResponse);
      })
      .finally(() => {
        controllers.delete(message.id);
      });
  });

  return {
    [Symbol.dispose]() {
      stopListening[Symbol.dispose]();
      for (const controller of controllers.values()) {
        controller.abort();
      }
      controllers.clear();
    },
  };
}
