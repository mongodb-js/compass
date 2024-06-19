import isElectronRenderer from 'is-electron-renderer';
import type { HadronIpcRenderer } from 'hadron-ipc';
import {
  type TelemetryPreferences,
  createGenericTrack,
  type TrackFunction,
  type TrackProps,
} from './generic-track';
import { type Logger } from '@mongodb-js/compass-logging';

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

export function createIpcTrack(
  logger?: Logger,
  preferences?: TelemetryPreferences
): TrackFunction {
  // This application may not be running in an Node.js/Electron context.
  const ipc: HadronIpcRenderer | null | undefined = isElectronRenderer
    ? // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('hadron-ipc').ipcRenderer
    : null;

  const sendTrack = (event: string, properties: TrackProps) =>
    emit(ipc, 'compass:track', { event, properties });

  return createGenericTrack({ sendTrack, logger, preferences });
}

export function createIpcTrackWithContext(
  logger: Logger,
  preferences: TelemetryPreferences
): TrackFunction {
  return createIpcTrack(logger, preferences);
}
