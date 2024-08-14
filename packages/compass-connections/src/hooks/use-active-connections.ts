import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useMemo } from 'react';
import { useConnectionsWithStatus } from '../provider';

/**
 * @deprecated use connection-store hooks instead
 */
export function useActiveConnections(): ConnectionInfo[] {
  const connectionsWithStatus = useConnectionsWithStatus();
  const activeConnections = useMemo(() => {
    return connectionsWithStatus
      .filter(({ connectionStatus }) => {
        return connectionStatus === 'connected';
      })
      .map(({ connectionInfo }) => connectionInfo);
  }, [connectionsWithStatus]);
  return activeConnections;
}
