import { type Logger, mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { TelemetryEvent, TrackFunction } from './types';

export interface TelemetryPreferences {
  getPreferences(): { trackUsageStatistics: boolean };
}

export type TelemetryConnectionInfoHook = () => { id: string };

export interface TelemetryServiceOptions {
  sendTrack: (event: string, props: Record<string, unknown>) => void;
  logger?: Logger;
  preferences?: TelemetryPreferences;
  useConnectionInfo?: TelemetryConnectionInfoHook;
}

type AsyncFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => Promise<ReturnType<T>>;

export const createTrack = ({
  sendTrack,
  logger: { log, debug },
  preferences,
}: TelemetryServiceOptions & { logger: Logger }) => {
  const trackAsync: AsyncFn<TrackFunction> = async (
    event: TelemetryEvent['name'],
    parametersOrFn: Parameters<TrackFunction>[1],
    connectionInfo?: { id?: string }
  ) => {
    // Note that this preferences check is mainly a performance optimization,
    // since the main process telemetry code also checks this preference value,
    // so it is safe to fall back to 'true'.
    const { trackUsageStatistics = true } = preferences?.getPreferences() ?? {};

    if (!trackUsageStatistics) {
      return;
    }

    let parameters: Record<string, unknown> =
      typeof parametersOrFn === 'object' ? parametersOrFn : {};

    // if parametersOrFn is a function use the return value of the function.
    if (typeof parametersOrFn === 'function') {
      try {
        parameters = await parametersOrFn();
      } catch (error) {
        // When an error arises during the fetching of properties,
        // for instance if we can't fetch host information,
        // we track a new error indicating the failure.
        // This is so that we are aware of which events might be misreported.
        sendTrack('Error Fetching Attributes', {
          event_name: event,
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

    if (connectionInfo) {
      parameters.connection_id = connectionInfo.id;
    }

    debug('sendTrack()', event, parameters);
    sendTrack(event, parameters || {});
  };

  const track = (...args: Parameters<typeof trackAsync>): void => {
    void Promise.resolve()
      .then(() => trackAsync(...args))
      .catch((error) => debug('track failed', error));
  };

  return track as TrackFunction;
};
