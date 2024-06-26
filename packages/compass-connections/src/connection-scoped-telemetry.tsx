import {
  useTelemetry,
  useTrackOnChangeGeneric,
  withTelemetry,
  type TrackFunction,
  type EventsPayload,
} from '@mongodb-js/compass-telemetry/provider';
import {
  type ConnectionInfoAccess,
  connectionInfoAccessLocator,
  useConnectionInfoAccess,
} from './provider';
import { createServiceLocator } from 'hadron-app-registry';

type TrackParametersWithoutConnectionId<T extends keyof EventsPayload> =
  | Omit<EventsPayload[T], 'connection_id'>
  | (() => Promise<Omit<EventsPayload[T], 'connection_id'>>)
  | (() => Omit<EventsPayload[T], 'connection_id'>);

export type ConnectionScopedTrackFunction = <T extends keyof EventsPayload>(
  event: T,
  parameters: TrackParametersWithoutConnectionId<T>
) => ReturnType<TrackFunction>;

function getCurriedTrack(
  track: TrackFunction,
  connectionInfoAccess: ConnectionInfoAccess
): ConnectionScopedTrackFunction {
  const curriedTrack: ConnectionScopedTrackFunction = (event, parameters) => {
    if (typeof parameters === 'function') {
      track(event, async () => ({
        ...(await parameters()),
        connection_id: connectionInfoAccess.getCurrentConnectionInfo().id,
      }));
    } else {
      track(event, {
        ...parameters,
        connection_id: connectionInfoAccess.getCurrentConnectionInfo().id,
      });
    }
  };

  return curriedTrack;
}

export function createConnectionScopedTelemetryLocator() {
  return createServiceLocator(
    function useConnectionScopedTelemetry(): ConnectionScopedTrackFunction {
      const track = useTelemetry();
      const connectionInfoAccess = connectionInfoAccessLocator();

      return getCurriedTrack(track, connectionInfoAccess);
    },
    'createConnectionScopedTelemetryLocator'
  );
}

export function useConnectionScopedTelemetry(): ConnectionScopedTrackFunction {
  const track = useTelemetry();
  const connectionInfoAccess = useConnectionInfoAccess();

  return getCurriedTrack(track, connectionInfoAccess);
}

export function withConnectionScopedTelemetry(
  component: Parameters<typeof withTelemetry>[0]
) {
  return withTelemetry(component, useConnectionScopedTelemetry);
}

export function useConnectionScopedTrackOnChange(
  onChange: (track: ConnectionScopedTrackFunction) => void,
  dependencies: Parameters<typeof useTrackOnChangeGeneric>['1'],
  options?: Parameters<typeof useTrackOnChangeGeneric>['2']
) {
  return useTrackOnChangeGeneric<ConnectionScopedTrackFunction>(
    onChange,
    dependencies,
    options,
    useConnectionScopedTelemetry
  );
}
