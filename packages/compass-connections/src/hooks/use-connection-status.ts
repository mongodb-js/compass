import { useConnectionInfo } from '@mongodb-js/connection-storage/provider';
import { useConnectionsManagerContext } from '../provider';
import {
  ConnectionStatus,
  ConnectionsManagerEvents,
} from '../connections-manager';

import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useEffect, useState } from 'react';

export function useConnectionStatus(connectionInfo?: ConnectionInfo): {
  status: ConnectionStatus;
} {
  if (!connectionInfo) {
    connectionInfo = useConnectionInfo();
  }

  const connectionManager = useConnectionsManagerContext();
  const [status, setStatus] = useState<ConnectionStatus>(
    connectionManager.statusOf(connectionInfo.id)
  );

  const updateStatus = () => {
    setStatus(
      connectionInfo
        ? connectionManager.statusOf(connectionInfo?.id)
        : ConnectionStatus.Disconnected
    );
  };

  useEffect(() => {
    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.on(event, updateStatus);
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.off(event, updateStatus);
      }
    };
  }, [updateStatus]);

  return { status };
}
