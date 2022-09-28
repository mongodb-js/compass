import type { MongoLogEntry } from 'mongodb-log-writer';
import { MongoLogWriter, mongoLogId } from 'mongodb-log-writer';
import isElectronRenderer from 'is-electron-renderer';
import createDebug from 'debug';
import type { Writable } from 'stream';
import type { HadronIpcRenderer } from 'hadron-ipc';

let preferences: {
  getPreferences(): Promise<{ trackUsageStatistics: boolean }>;
};

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

  const track = (...args: [string, TrackProps?]) => {
    void Promise.resolve()
      .then(() => trackAsync(...args))
      .catch((error) => debug('track failed', error));
  };

  const trackAsync = async (
    event: string,
    properties: TrackProps = {}
  ): Promise<void> => {
    // Avoid circular dependency between compass-logging and compass-preferences-model
    // Note that this is mainly a performance optimization, since the main process
    // telemetry code also checks this preference value, so it is safe to fall back to 'true'.
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-error Types from the dependency may not be available in early bootstrap.
      preferences ??= (await import('compass-preferences-model'))
        .preferencesAccess;
    } catch {
      preferences ??= {
        getPreferences() {
          return Promise.resolve({ trackUsageStatistics: true });
        },
      };
    }
    const { trackUsageStatistics = true } = preferences?.getPreferences();
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
