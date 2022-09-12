import type { MongoLogEntry } from 'mongodb-log-writer';
import { MongoLogWriter, mongoLogId } from 'mongodb-log-writer';
import isElectronRenderer from 'is-electron-renderer';
import createDebug from 'debug';
import type { Writable } from 'stream';
import type { HadronIpcRenderer } from 'hadron-ipc';
import { preferencesIpc } from 'compass-preferences-model';

type TrackProps = Record<string, any> | (() => Record<string, any>);
type TrackFunction = (event: string, properties?: TrackProps) => void;

function emit(
  ipc: HadronIpcRenderer | null,
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

export function createLoggerAndTelemetry(component: string): {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
  debug: ReturnType<typeof createDebug>;
  track: TrackFunction;
} {
  // This application may not be running in an Node.js/Electron context.
  const ipc: HadronIpcRenderer | null = isElectronRenderer
    ? require('hadron-ipc')
    : null;

  // Do not create an actual Writable stream here, since the callback
  // logic in Node.js streams would mean that two writes from the
  // same event loop tick would not be written synchronously,
  // allowing another logger's write to be written out-of-order.
  const target = {
    write(line: string, callback: () => void) {
      emit(ipc, 'compass:log', { line });
      callback();
    },
    end(callback: () => void) {
      callback();
    },
  } as Writable;
  const writer = new MongoLogWriter('', null, target);
  let preferences: any;
  let trackUsageStatistics = false;

  const trackUsageStatisticsInit = async () => {
    preferences = await preferencesIpc.getPreferences();
    trackUsageStatistics = preferences?.trackUsageStatistics;
  };
  preferencesIpc.onPreferencesChanged((preferences: any) => {
    trackUsageStatistics = preferences?.trackUsageStatistics;
  });

  const track = (...args: [string, TrackProps?]) => {
    void Promise.resolve()
      .then(() => trackAsync(...args))
      .catch((error) => debug('track failed', error));
  };

  const trackAsync = async (
    event: string,
    properties: TrackProps = {}
  ): Promise<void> => {
    if (!preferences) {
      await trackUsageStatisticsInit();
    }

    if (!trackUsageStatistics) {
      return;
    }

    const data = {
      event,
      properties,
    };
    if (typeof properties === 'function') {
      data.properties = await properties();
    }
    emit(ipc, 'compass:track', data);
  };

  const debug = createDebug(`mongodb-compass:${component.toLowerCase()}`);
  writer.on('log', ({ s, ctx, msg, attr }: MongoLogEntry) => {
    if (attr) {
      debug(msg, { s, ctx, ...attr });
    } else {
      debug(msg, { s, ctx });
    }
  });
  return {
    log: writer.bindComponent(component),
    mongoLogId,
    debug,
    track,
  };
}

export default createLoggerAndTelemetry;
