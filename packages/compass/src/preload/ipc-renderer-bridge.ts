import { ipcRenderer, shell, webFrame, webUtils } from 'electron';
import { app } from '@electron/remote';

/**
 * Hands `ipcRenderer` to the renderer on the global so that `hadron-ipc` does
 * not have to `import 'electron'` itself, which is unavailable once
 * `nodeIntegration` is off.
 *
 * This is a stepping stone, not the destination: the individual channels still
 * need to move to a MessagePort the way the data service did. Exposing the
 * object wholesale only works while `contextIsolation` is off, since a
 * `contextBridge` would flatten the prototype and drop the event emitter API.
 */
function expose(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    value,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

export function setupIpcRendererBridge(): void {
  expose('__COMPASS_IPC_RENDERER__', ipcRenderer);
  expose('__COMPASS_ELECTRON__', {
    shell,
    webFrame,
    webUtils,
    // Only the three accessors the renderer actually needs, rather than the
    // whole `app` object, so nothing else starts depending on remote.
    app: {
      getName: () => app.getName(),
      getVersion: () => app.getVersion(),
      getPath: (name: Parameters<typeof app.getPath>[0]) => app.getPath(name),
    },
  });
}
