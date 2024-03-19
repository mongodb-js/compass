import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useCallback, useEffect, useState } from 'react';
import { useConnectionRepositoryContext } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManagerEvents,
  useConnectionsManagerContext,
} from '../provider';

export function useActiveConnections(): ConnectionInfo[] {
  const connectionManager = useConnectionsManagerContext();
  const connectionRepository = useConnectionRepositoryContext();

  const [activeConnections, setActiveConnections] = useState<ConnectionInfo[]>(
    []
  );

  const updateList = useCallback(async () => {
    const list = [
      ...(await connectionRepository.listFavoriteConnections()),
      ...(await connectionRepository.listNonFavoriteConnections()),
    ].filter(({ id }) => connectionManager.statusOf(id) === 'connected');
    setActiveConnections(list);
  }, []);

  useEffect(() => {
    void updateList();

    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.on(event, () => void updateList());
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.off(event, () => void updateList());
      }
    };
  }, [updateList]);

  return activeConnections;
}
