import type { IpcMain, IpcMainEvent } from 'electron';
import electron from 'electron';
import createDebug from 'debug';
import { getResponseChannel } from './common';
import { serializeErrorForIpc } from './serialized-error';

const debug = createDebug('hadron-ipc:main');

const isPromiseLike = <T>(val: any): val is PromiseLike<T> => {
  return (
    val &&
    typeof val === 'object' &&
    'then' in val &&
    typeof val.then === 'function'
  );
};

type ResponseHandler = (event: IpcMainEvent, ...args: any[]) => any;

function isMethodMap(
  methodName: any
): methodName is Record<string, ResponseHandler> {
  return (
    methodName &&
    typeof methodName === 'object' &&
    Object.values(methodName).every((v) => typeof v === 'function')
  );
}

export function respondTo(
  ipcMain: Pick<IpcMain, 'on'> | undefined,
  methodName: string | Record<string, ResponseHandler>,
  handler?: ResponseHandler
): void {
  if (isMethodMap(methodName)) {
    for (const [name, methodHandler] of Object.entries(methodName)) {
      respondTo(ipcMain, name, methodHandler);
    }
    return;
  }

  const responseChannel = getResponseChannel(methodName);
  const errorResponseChannel = `${responseChannel}-error`;

  ipcMain?.on(methodName, (event, ...args) => {
    const resolve = (result: any) => {
      debug(`responding with result for ${methodName}`, result);
      if (event.sender.isDestroyed()) {
        return debug('browserWindow went away.  nothing to send response to.');
      }
      event.sender.send(responseChannel, result);
    };
    const reject = (err: any) => {
      debug(`responding with error for ${methodName}`, err);
      if (event.sender.isDestroyed()) {
        return debug('browserWindow went away.  nothing to send response to.');
      }
      event.sender.send(errorResponseChannel, err);
    };

    debug(`calling ${methodName} handler with args`, args);
    const res = handler?.(event, ...args);
    if (isPromiseLike(res)) {
      res.then(resolve, reject);
    } else if (res instanceof Error) {
      reject(res);
    } else {
      resolve(res);
    }
  });
  return exports;
}

/**
 * Broadcast an event to all the renderer processes
 */
export function broadcast(channel: string, ...args: any[]) {
  // We might not be in electron environment
  electron.BrowserWindow?.getAllWindows().forEach((browserWindow) => {
    browserWindow.webContents?.send(channel, ...args);
  });
}

/**
 * Broadcast an event to currently focused window
 */
export function broadcastFocused(channel: string, ...args: any[]) {
  // We might not be in electron environment
  electron.BrowserWindow?.getFocusedWindow()?.webContents?.send(
    channel,
    ...args
  );
}

/**
 * Remove listener for a channel
 */
export function remove(
  ipcMain: Pick<IpcMain, 'removeListener'> | undefined,
  channel: string,
  listener: (...args: unknown[]) => void
) {
  ipcMain?.removeListener(channel, listener);
}

const ipcMain = electron.ipcMain
  ? Object.assign(electron.ipcMain, {
      /**
       * Broadcast an event to all the renderer processes
       */
      broadcast,

      /**
       * Broadcast an event to currently focused window
       */
      broadcastFocused,

      /**
       * Set up a listener for a call from the renderer process dispatched with
       * a `ipcRenderer.call` or `ipcRenderer.callQuiet` method
       */
      respondTo: respondTo.bind(null, electron.ipcMain),

      /**
       * Remove event listener from ipcMain
       */
      remove: remove.bind(null, electron.ipcMain),

      /**
       * Helper method to expose multiple methods from the main process through
       * `ipcMain.handle` with stricter types, better error handling, and
       * support for AbortController
       *
       * @param serviceName Identifier used to locate the service methods from
       *                    the renderer process
       * @param obj         Object which methods will be exposed to the renderer
       *                    process
       * @param methodNames List of the method names that will get exposed
       */
      createHandle: <T>(
        serviceName: string,
        obj: T,
        methodNames: Extract<
          keyof PickByValue<T, (options: any) => Promise<any>>,
          string
        >[]
      ) => {
        return ipcHandle<T>(ipcMain, serviceName, obj, methodNames);
      },
    })
  : undefined;

/**
 * Exported for testing purposes
 * @internal
 */
export const ControllerMap = new Map<string, AbortController>();

let setup = false;

export function setupSignalHandler(
  _ipcMain: Pick<IpcMain, 'handle'> | undefined = ipcMain,
  forceSetup = false
) {
  if (!forceSetup && setup) {
    return;
  }

  setup = true;

  _ipcMain?.handle('ipcHandlerInvoke', (_evt, id: string) => {
    ControllerMap.set(id, new AbortController());
  });

  _ipcMain?.handle('ipcHandlerAborted', (_evt, id: string) => {
    ControllerMap.get(id)?.abort();
  });
}

export function ipcHandle<T>(
  ipcMain: Pick<IpcMain, 'handle'> | undefined,
  serviceName: string,
  obj: T,
  methodNames: Extract<
    keyof PickByValue<T, (options: any) => Promise<any>>,
    string
  >[],
  _forceSetup = false
): void {
  setupSignalHandler(ipcMain, _forceSetup);

  for (const name of methodNames) {
    const channel = `${serviceName}.${name}`;
    ipcMain?.handle(
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

export default ipcMain;
