import { type HadronIpcRenderer } from 'hadron-ipc';
import { type TelemetryPreferences, createTrack } from './generic-track';
import { createLogger, type Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from './types';

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
  const sendTrack = createIpcSendTrack();

  if (!logger) logger = createLogger('COMPASS-TELEMETRY');

  return createTrack({ sendTrack, logger, preferences });
}

export function createIpcSendTrack() {
  // This application may not be running in an Node.js/Electron context.
  const ipc =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('hadron-ipc').ipcRenderer;

  const sendTrack: TrackFunction = (event, properties) =>
    emit(ipc, 'compass:track', { event, properties });

  return sendTrack;
}
