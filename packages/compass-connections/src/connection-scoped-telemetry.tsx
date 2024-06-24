import {
  useTelemetry,
  useTrackOnChangeGeneric,
  withTelemetry,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { connectionInfoAccessLocator } from './provider';

export type ConnectionScopedTrackFunction = (
  event: Parameters<TrackFunction>[0],
  parameters: Omit<Parameters<TrackFunction>[1], 'connectionId'>
) => ReturnType<TrackFunction>;

export function useConnectionScopedTelemetry(): ConnectionScopedTrackFunction {
  const track = useTelemetry();
  const connectionInfoAccess = connectionInfoAccessLocator();
  const curriedTrack: ConnectionScopedTrackFunction = (event, parameters) => {
    track(event, {
      ...parameters,
      connectionId: connectionInfoAccess.getCurrentConnectionInfo().id,
    });
  };

  return curriedTrack;
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
