import type { MongoLogEntry } from 'mongodb-log-writer';
import { MongoLogWriter, mongoLogId } from 'mongodb-log-writer';
import createDebug from 'debug';
import type { Writable } from 'stream';

let preferences: {
  getPreferences(): { trackUsageStatistics: boolean };
};

type TrackProps = Record<string, any> | (() => Record<string, any>);
type TrackFunction = (event: string, properties?: TrackProps) => void;

export type LoggerAndTelemetry = {
  log: ReturnType<MongoLogWriter['bindComponent']>;
  mongoLogId: typeof mongoLogId;
  debug: ReturnType<typeof createDebug>;
  track: TrackFunction;
};

export function createGenericLoggerAndTelemetry(
  component: string,
  emit: (event: string, arg: any) => void
): LoggerAndTelemetry {
  // Do not create an actual Writable stream here, since the callback
  // logic in Node.js streams would mean that two writes from the
  // same event loop tick would not be written synchronously,
  // allowing another logger's write to be written out-of-order.
  const target = {
    write(line: string, callback: () => void) {
      emit('compass:log', { line });
      callback();
    },
    end(callback: () => void) {
      callback();
    },
  } as Writable;
  const writer = new MongoLogWriter('', null, target);
  const log = writer.bindComponent(component);

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
          return { trackUsageStatistics: true };
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
      try {
        data.properties = await properties();
      } catch (error) {
        // When an error arises during the fetching of properties,
        // for instance if we can't fetch host information,
        // we track a new error indicating the failure.
        // This is so that we are aware of which events might be misreported.
        emit('compass:track', {
          event: 'Error Fetching Attributes',
          properties: {
            event_name: event,
          },
        });
        log.error(
          mongoLogId(1_001_000_190),
          'Telemetry',
          'Error computing event properties for telemetry',
          {
            event,
            error: (error as Error).stack,
          }
        );

        return;
      }
    }
    emit('compass:track', data);
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
    log,
    mongoLogId,
    debug,
    track,
  };
}
