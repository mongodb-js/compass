import { useConnectionsManagerContext } from '../provider';
import {
  type ConnectionStatus,
  ConnectionsManagerEvents,
} from '../connections-manager';

import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useEffect, useState } from 'react';

export function useConnectionStatus(connectionInfoId: ConnectionInfo['id']): {
  status: ConnectionStatus;
} {
  const connectionManager = useConnectionsManagerContext();
  const [status, setStatus] = useState<ConnectionStatus>(
    connectionManager.statusOf(connectionInfoId)
  );

  useEffect(() => {
    const updateStatus = () => {
      setStatus(connectionManager.statusOf(connectionInfoId));
    };

    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.on(event, updateStatus);
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.off(event, updateStatus);
      }
    };
  }, [connectionManager, connectionInfoId]);

  return { status };
}
