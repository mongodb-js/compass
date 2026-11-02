import type { ContextBridge, IpcRenderer } from 'electron';
import {
  USER_DATA_BRIDGE,
  USER_DATA_CHANNEL,
  type UserDataBridge,
} from '@mongodb-js/compass-utils';

/** Lets the renderer reach local user data, which main stores on disk */
export function exposeUserDataBridge(
  target: Window,
  ipcRenderer: Pick<IpcRenderer, 'invoke'>,
  contextBridge: Pick<ContextBridge, 'exposeInMainWorld'>,
  contextIsolated: boolean
): void {
  const bridge: UserDataBridge = {
    request: (request) => ipcRenderer.invoke(USER_DATA_CHANNEL, request),
  };
  if (contextIsolated) {
    contextBridge.exposeInMainWorld(USER_DATA_BRIDGE, bridge);
  } else {
    // exposeInMainWorld throws without context isolation, and then the
    // preload shares the page's window anyway
    Object.assign(target, { [USER_DATA_BRIDGE]: bridge });
  }
}
