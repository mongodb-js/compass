import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

export function trackConnectionDisconnectedEvent(
  connectionInfo: ConnectionInfo | undefined,
  track: TrackFunction
): void {
  track('Connection Disconnected', {}, connectionInfo);
}

export function trackConnectionCreatedEvent(
  connectionInfo: ConnectionInfo | undefined,
  track: TrackFunction
): void {
  track(
    'Connection Created',
    {
      color: connectionInfo?.favorite?.color,
    },
    connectionInfo
  );
}

export function trackConnectionRemovedEvent(
  connectionInfo: ConnectionInfo | undefined,
  track: TrackFunction
): void {
  track('Connection Removed', {}, connectionInfo);
}
