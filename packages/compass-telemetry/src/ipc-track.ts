import isElectronRenderer from 'is-electron-renderer';
import type { HadronIpcRenderer } from 'hadron-ipc';
import { type TelemetryPreferences, createGenericTrack } from './track';

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

export function createTrack(preferencesService?: TelemetryPreferences) {
  // This application may not be running in an Node.js/Electron context.
  const ipc: HadronIpcRenderer | null | undefined = isElectronRenderer
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('hadron-ipc').ipcRenderer
    : null;
  return createGenericTrack(emit.bind(null, ipc), preferencesService);
}
