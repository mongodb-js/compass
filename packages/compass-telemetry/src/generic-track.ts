import { type Logger, mongoLogId } from '@mongodb-js/compass-logging';

export type TrackProps = Record<string, any> | (() => Record<string, any>);
export type TrackFunction = (event: string, properties?: TrackProps) => void;

export interface TelemetryPreferences {
  getPreferences(): { trackUsageStatistics: boolean };
}

export interface TelemetryServiceOptions {
  sendTrack: (event: string, properties: Record<string, any>) => void;
  logger?: Logger;
  preferences?: TelemetryPreferences;
}

export const createTrack = ({
  sendTrack,
  logger: { log, debug },
  preferences,
}: TelemetryServiceOptions & { logger: Logger }) => {
  const trackAsync = async (
    event: string,
    properties: TrackProps = {}
  ): Promise<void> => {
    // Note that this preferences check is mainly a performance optimization,
    // since the main process telemetry code also checks this preference value,
    // so it is safe to fall back to 'true'.
    const { trackUsageStatistics = true } = preferences?.getPreferences() ?? {};

    if (!trackUsageStatistics) {
      return;
    }

    if (typeof properties === 'function') {
      try {
        properties = await properties();
      } catch (error) {
        // When an error arises during the fetching of properties,
        // for instance if we can't fetch host information,
        // we track a new error indicating the failure.
        // This is so that we are aware of which events might be misreported.
        sendTrack('Error Fetching Attributes', {
          event_name: event,
        });
        log.error(
          mongoLogId(1_001_000_313),
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
    sendTrack(event, properties);
  };

  const track = (...args: [string, TrackProps?]) => {
    void Promise.resolve()
      .then(() => trackAsync(...args))
      .catch((error) => debug('track failed', error));
  };

  return track;
};
