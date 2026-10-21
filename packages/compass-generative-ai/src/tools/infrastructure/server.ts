import { listen } from '@mongodb-js/compass-utils';
import { isToolsRpcMessage } from './messages';
import type {
  ToolsRpcMethod,
  ToolsRpcPort,
  ToolsRpcResponse,
} from './messages';

/**
 * Utility-side server. `port` is a `MessagePortMain` received through
 * `onPort` (already started). Each request gets its own AbortController;
 * abort messages for that id abort it.
 */
export function serveToolsRequests(
  port: ToolsRpcPort,
  handler: (
    method: ToolsRpcMethod,
    params: unknown,
    signal: AbortSignal
  ) => Promise<unknown>
): Disposable {
  const controllers = new Map<number, AbortController>();

  return listen(port, 'message', (event: { data: unknown }) => {
    const message = event.data;
    if (!isToolsRpcMessage(message)) return;

    if (message.kind === 'abort') {
      controllers.get(message.id)?.abort();
      return;
    }

    if (message.kind !== 'request') return;

    const controller = new AbortController();

    controllers.set(message.id, controller);

    // The handler may throw synchronously; route it through a promise chain
    // so a throw becomes a rejection instead of an uncaught error that would
    // take the utility process down.
    Promise.resolve()
      .then(() => handler(message.method, message.params, controller.signal))
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
}
