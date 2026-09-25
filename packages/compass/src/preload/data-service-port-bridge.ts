import { ipcRenderer } from 'electron';

/**
 * Forwards the MessagePort that a DataServiceRenderer posts on the window to
 * the main process, which relays it to the data service utility process.
 *
 * `window.postMessage`/`'message'` events are dispatched at the shared
 * Window level, so this works whether or not `contextIsolation` is enabled,
 * no `contextBridge` needed: the renderer only ever broadcasts a message, it
 * never calls anything this preload script would need to expose.
 */
export function setupDataServicePortBridge(): void {
  window.addEventListener('message', (event) => {
    // eslint-disable-next-line no-console
    console.log('message', event);
    if (
      event.source === window &&
      event.data?.type === 'compass:data-service:port'
    ) {
      ipcRenderer.postMessage('compass:data-service:port', event.data, [
        ...event.ports,
      ]);
    }
  });
}
