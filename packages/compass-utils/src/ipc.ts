import { ipcMain, ipcRenderer, BrowserWindow } from 'electron';

type SerializedError = { $$error: Error & { statusCode?: number } };

// We are serializing errors to get a better error shape on the other end, ipc
// will only preserve message from the original error. See https://github.com/electron/electron/issues/24427
function serializeErrorForIpc(err: any): SerializedError {
  return {
    $$error: {
      name: err.name,
      message: err.message,
      statusCode: err.status,
      stack: err.stack,
    },
  };
}

function deserializeErrorFromIpc({ $$error: err }: SerializedError) {
  const e = new Error(err.message);
  e.name = err.name;
  e.stack = err.stack;
  (e as any).stausCode = err.statusCode;
  return e;
}

function isSerializedError(err: any): err is { $$error: Error } {
  return err !== null && typeof err === 'object' && !!err.$$error;
}

// Exported for testing purposes
export const ControllerMap = new Map<string, AbortController>();

let cId = 0;

let setup = false;

function setupSignalHandler(
  _ipcMain: Pick<typeof ipcMain, 'handle'> = ipcMain,
  forceSetup = false
) {
  if (!forceSetup && setup) {
    return;
  }

  setup = true;

  _ipcMain.handle('ipcHandlerInvoke', (_evt, id: string) => {
    ControllerMap.set(id, new AbortController());
  });

  _ipcMain.handle('ipcHandlerAborted', (_evt, id: string) => {
    ControllerMap.get(id)?.abort();
  });
}

type PickByValue<T, K> = Pick<
  T,
  { [k in keyof T]: T[k] extends K ? k : never }[keyof T]
>;

export function ipcExpose<T>(
  serviceName: string,
  obj: T,
  methodNames: Extract<
    keyof PickByValue<T, (options: any) => Promise<any>>,
    string
  >[],
  _ipcMain: Pick<typeof ipcMain, 'handle'> = ipcMain,
  _forceSetup = false
) {
  setupSignalHandler(_ipcMain, _forceSetup);

  for (const name of methodNames) {
    const channel = `${serviceName}.${name}`;
    _ipcMain.handle(
      channel,
      async (
        _evt,
        { signal, ...rest }: { signal: string } & Record<string, unknown>
      ) => {
        try {
          const controller = ControllerMap.get(signal);
          return await (obj[name] as (...args: any[]) => any).call(obj, {
            signal: controller?.signal,
            ...rest,
          });
        } catch (err) {
          return serializeErrorForIpc(err);
        } finally {
          ControllerMap.delete(signal);
        }
      }
    );
  }
}

export function ipcInvoke<
  T,
  K extends Extract<
    keyof PickByValue<T, (options: any) => Promise<any>>,
    string
  >
>(
  serviceName: string,
  methodNames: K[],
  _ipcRenderer: Pick<typeof ipcRenderer, 'invoke'> = ipcRenderer
) {
  return Object.fromEntries(
    methodNames.map((name) => {
      const channel = `${serviceName}.${name}`;
      const signalId = `${channel}:${++cId}`;
      return [
        name,
        async ({
          signal,
          ...rest
        }: { signal?: AbortSignal } & Record<string, unknown> = {}) => {
          await _ipcRenderer.invoke('ipcHandlerInvoke', signalId);
          const onAbort = () => {
            return _ipcRenderer.invoke('ipcHandlerAborted', signalId);
          };
          // If signal is already aborted, make sure that handler will see it
          // when it runs, otherwise just set up abort listener to communicate
          // this to main process
          if (signal?.aborted) {
            await onAbort();
          } else {
            signal?.addEventListener(
              'abort',
              () => {
                void onAbort();
              },
              { once: true }
            );
          }
          const res = await _ipcRenderer.invoke(`${serviceName}.${name}`, {
            // We replace this with a matched signal on the other side, this
            // is mostly for testing / debugging purposes
            signal: signalId,
            ...rest,
          });
          if (isSerializedError(res)) {
            throw deserializeErrorFromIpc(res);
          }
          return res;
        },
      ];
    })
  ) as Pick<T, K>;
}

/**
 * Broadcast an event to all the renderer processes
 */
export function broadcast(channel: string, ...args: any[]) {
  // We might not be in electron environment
  BrowserWindow?.getAllWindows().forEach((browserWindow) => {
    browserWindow.webContents.send(channel, ...args);
  });
}
