import type { IpcRenderer } from 'electron';
import { isUtilityPortChannel } from '../utilities/conventions';
import { listen } from '../listen';

export function forwardUtilityPorts(
  target: Window,
  ipcRenderer: Pick<IpcRenderer, 'postMessage'>
): Disposable {
  return listen(target, 'message', (event: MessageEvent) => {
    const channel: unknown = event.data?.type;
    if (event.source === target && isUtilityPortChannel(channel)) {
      ipcRenderer.postMessage(channel, event.data, [...event.ports]);
    }
  });
}
