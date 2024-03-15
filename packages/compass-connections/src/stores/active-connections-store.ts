import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useEffect, useState } from 'react';
import { useConnectionRepositoryContext } from '@mongodb-js/connection-storage/provider';

export function useActiveConnections(): ConnectionInfo[] {
  const connectionManager = useConnectionsManagerContext();
  const connectionRepository = useConnectionRepositoryContext();

  const [activeConnections, setActiveConnections] = useState<ConnectionInfo[]>(
    []
  );

  const updateList = async () => {
    const list = [
      ...(await connectionRepository.listFavoriteConnections()),
      ...(await connectionRepository.listNonFavoriteConnections()),
    ].filter(({ id }) => connectionManager.statusOf(id) === 'connected');
    // TODO: sort alphabetically
    setActiveConnections(list);
  };

  useEffect(() => {
    void updateList();

    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.addListener(event, updateList);
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.addListener(event, updateList);
      }
    };
  }, [updateList]);

  return activeConnections;
}
