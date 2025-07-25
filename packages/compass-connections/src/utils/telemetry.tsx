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

export function getErrorCodeCauseChain(
  err: unknown
): (string | number)[] | undefined {
  const errorCodesInCauseChain: (string | number)[] = [];
  let current = err;

  while (current && typeof current === 'object') {
    if ('code' in current && current.code) {
      errorCodesInCauseChain.push(current.code as string | number);
    } else if ('codeName' in current && current.codeName) {
      errorCodesInCauseChain.push(current.codeName as string | number);
    }
    current = (current as { cause?: unknown }).cause;
  }

  if (errorCodesInCauseChain.length === 0) {
    return undefined;
  }

  return errorCodesInCauseChain;
}
