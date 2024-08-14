import { useMemo } from 'react';
import type { ConnectionInfo } from '../provider';
import type { ConnectionState } from '../stores/connections-store-redux';
import {
  useConnectionForId,
  useConnectionsList,
} from '../stores/store-context';

type ConnectionInfoWithStatus = {
  connectionInfo: ConnectionInfo;
  connectionStatus: ConnectionState['status'];
};

/**
 * @deprecated use connections-store hooks instead
 */
export function useConnectionInfoStatus(
  connectionId: string
): ConnectionInfoWithStatus['connectionStatus'] | null {
  const connection = useConnectionForId(connectionId);
  return connection?.status ?? 'disconnected';
}

/**
 * @deprecated use connections-store hooks instead
 */
export function useConnectionsWithStatus(): ConnectionInfoWithStatus[] {
  const connections = useConnectionsList((connection) => {
    return !connection.isBeingCreated;
  });
  return useMemo(() => {
    return connections.map((connection) => {
      return {
        connectionInfo: connection.info,
        connectionStatus: connection.status,
      };
    });
  }, [connections]);
}
