import isElectronRenderer from 'is-electron-renderer';
import type { HadronIpcRenderer } from 'hadron-ipc';
import { createGenericLogger } from './logger';

function emit(
  ipc: HadronIpcRenderer | null | undefined,
  event: string,
  data: Record<string, any>
): void {
  // We use ipc.callQuiet instead of ipc.call because we already
  // print debugging messages below
  void ipc?.callQuiet?.(event, data);
  if (typeof process !== 'undefined' && typeof process.emit === 'function') {
    (process as any).emit(event, data);
  }
}

export function createLogger(component: string) {
  // This application may not be running in an Node.js/Electron context.
  const ipc: HadronIpcRenderer | null | undefined = isElectronRenderer
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('hadron-ipc').ipcRenderer
    : null;
  return createGenericLogger(component, emit.bind(null, ipc));
}
