import electron from 'electron';
import createDebug from 'debug';
import { getResponseChannel } from './common';

const debug = createDebug('hadron-ipc:main');

const isPromiseLike = <T>(val: any): val is PromiseLike<T> => {
  return val && 'then' in val && typeof val.then === 'function';
};

type ResponseHandler = (
  browserWindow: electron.BrowserWindow,
  ...args: any[]
) => any;

function isMethodMap(
  methodName: any
): methodName is Record<string, ResponseHandler> {
  return (
    methodName &&
    typeof methodName === 'object' &&
    Object.values(methodName).every((v) => typeof v === 'function')
  );
}

/**
 *
 */
function respondTo(methodName: string, handler: ResponseHandler): void;
function respondTo(methodName: Record<string, ResponseHandler>): void;
function respondTo(
  methodName: string | Record<string, ResponseHandler>,
  handler?: ResponseHandler
): void {
  if (isMethodMap(methodName)) {
    for (const [name, methodHandler] of Object.entries(methodName)) {
      respondTo(name, methodHandler);
    }
    return;
  }

  const ipcMain = electron.ipcMain as electron.IpcMain | undefined;
  const responseChannel = getResponseChannel(methodName);
  const errorResponseChannel = `${responseChannel}-error`;

  ipcMain?.on(methodName, (event, ...args) => {
    const browserWindow = electron.BrowserWindow?.fromWebContents(event.sender);
    // In rare cases when browserWindow is closed/destroyed before we even had a
    // chance to get the reference to it from web contents, browserWindow might
    // be null here
    if (!browserWindow) {
      return;
    }
    const resolve = (result: any) => {
      debug(`responding with result for ${methodName}`, result);
      if (browserWindow.isDestroyed()) {
        return debug('browserWindow went away.  nothing to send response to.');
      }
      event.sender.send(responseChannel, result);
    };
    const reject = (err: any) => {
      debug(`responding with error for ${methodName}`, err);
      if (browserWindow.isDestroyed()) {
        return debug('browserWindow went away.  nothing to send response to.');
      }
      event.sender.send(errorResponseChannel, err);
    };

    debug(`calling ${methodName} handler with args`, args);
    const res = handler?.(browserWindow, ...args);
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
  channel: string,
  listener: (...args: unknown[]) => void
) {
  electron.ipcMain?.removeListener(channel, listener);
}

export default Object.assign(electron.ipcMain ?? {}, {
  respondTo,
  broadcast,
  broadcastFocused,
  remove,
});
