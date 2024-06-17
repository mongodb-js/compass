import { createLogger, mongoLogId } from '@mongodb-js/compass-logging';

type TrackProps = Record<string, any> | (() => Record<string, any>);
export type TrackFunction = (event: string, properties?: TrackProps) => void;

const { log, debug } = createLogger('COMPASS-TELEMETRY');

export interface TelemetryPreferences {
  getPreferences(): { trackUsageStatistics: boolean };
}

export const createGenericTrack = (
  emit: (event: string, arg: any) => void,
  preferencesService?: TelemetryPreferences
) => {
  const trackAsync = async (
    event: string,
    properties: TrackProps = {}
  ): Promise<void> => {
    // Note that this preferences check is mainly a performance optimization,
    // since the main process telemetry code also checks this preference value,
    // so it is safe to fall back to 'true'.
    const { trackUsageStatistics = true } =
      preferencesService?.getPreferences() ?? {};

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

  const track = (...args: [string, TrackProps?]) => {
    void Promise.resolve()
      .then(() => trackAsync(...args))
      .catch((error) => debug('track failed', error));
  };

  return track;
};
