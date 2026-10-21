import { listen } from '@mongodb-js/compass-utils';
import { isResponse } from './messages';
import type {
  ToolsRpcAbort,
  ToolsRpcMethod,
  ToolsRpcPort,
  ToolsRpcRequest,
} from './messages';

/**
 * Renderer-side client. `port` is the end of the channel returned by
 * `openUtilityPort`.
 */
export function createToolsRpcClient(port: ToolsRpcPort): {
  call(
    method: ToolsRpcMethod,
    params?: unknown,
    signal?: AbortSignal
  ): Promise<unknown>;
  close(): void;
} {
  let nextId = 0;
  const pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
  >();

  const stopListening = listen(port, 'message', (event: { data: unknown }) => {
    const message = event.data;
    if (!isResponse(message)) return;

    const entry = pending.get(message.id);
    if (!entry) return;

    pending.delete(message.id);

    if (message.ok) entry.resolve(message.result);
    else entry.reject(new Error(message.error));
  });

  return {
    call(method, params, signal) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          return reject(
            signal.reason ?? new Error('The operation was aborted')
          );
        }
        pending.set(id, { resolve, reject });
        if (signal) {
          listen(signal, 'abort', () => {
            pending.delete(id);
            port.postMessage({ kind: 'abort', id } satisfies ToolsRpcAbort);
            reject(signal.reason ?? new Error('The operation was aborted'));
          });
        }
        port.postMessage({
          kind: 'request',
          id,
          method,
          params,
        } satisfies ToolsRpcRequest);
      });
    },
    close() {
      for (const { reject } of pending.values()) {
        reject(new Error('Tools rpc client closed'));
      }
      pending.clear();
      stopListening[Symbol.dispose]();
    },
  };
}
