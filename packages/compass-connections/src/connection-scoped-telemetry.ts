import {
  useTelemetry,
  type TrackFunction,
} from '@mongodb-js/compass-telemetry/provider';
import { connectionInfoAccessLocator } from './provider';

type ConnectionScopedTrackFunction = (
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
