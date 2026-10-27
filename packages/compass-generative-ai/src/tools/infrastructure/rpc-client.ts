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
    {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
      /** Removes the abort listener the call installed, if any */
      stopListeningForAbort?: () => void;
    }
  >();

  const settle = (
    id: number,
    settleEntry: (entry: {
      resolve: (value: unknown) => void;
      reject: (reason: unknown) => void;
      stopListeningForAbort?: () => void;
    }) => void
  ): void => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    entry.stopListeningForAbort?.();
    settleEntry(entry);
  };

  const stopListening = listen(port, 'message', (event: { data: unknown }) => {
    const message = event.data;
    if (!isResponse(message)) return;

    settle(message.id, (entry) => {
      if (message.ok) entry.resolve(message.result);
      else entry.reject(new Error(message.error));
    });
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
          const stopListeningForAbort = listen(signal, 'abort', () => {
            settle(id, (entry) => {
              port.postMessage({ kind: 'abort', id } satisfies ToolsRpcAbort);
              entry.reject(
                signal.reason ?? new Error('The operation was aborted')
              );
            });
          });
          pending.get(id)!.stopListeningForAbort = () =>
            stopListeningForAbort[Symbol.dispose]();
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
      for (const id of [...pending.keys()]) {
        settle(id, (entry) =>
          entry.reject(new Error('Tools rpc client closed'))
        );
      }
      stopListening[Symbol.dispose]();
      port.close();
    },
  };
}
