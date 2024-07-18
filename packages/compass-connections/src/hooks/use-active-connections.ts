import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useMemo } from 'react';
import { useConnectionsWithStatus, ConnectionStatus } from '../provider';

export function useActiveConnections(): ConnectionInfo[] {
  const connectionsWithStatus = useConnectionsWithStatus();
  const activeConnections = useMemo(() => {
    return connectionsWithStatus
      .filter(({ connectionStatus }) => {
        return connectionStatus === ConnectionStatus.Connected;
      })
      .map(({ connectionInfo }) => connectionInfo);
  }, [connectionsWithStatus]);
  return activeConnections;
}
