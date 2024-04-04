import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useCallback, useEffect, useState } from 'react';
import {
  ConnectionsManagerEvents,
  useConnectionsManagerContext,
} from '../provider';
import {
  areConnectionsEqual,
  useConnectionRepository,
} from './use-connection-repository';

export function useActiveConnections(): ConnectionInfo[] {
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionManager = useConnectionsManagerContext();
  const { favoriteConnections, nonFavoriteConnections } =
    useConnectionRepository();

  const [activeConnections, setActiveConnections] = useState<ConnectionInfo[]>(
    []
  );

  const updateList = useCallback(() => {
    const newList = [...favoriteConnections, ...nonFavoriteConnections].filter(
      ({ id }) => connectionManager.statusOf(id) === 'connected'
    );

    setActiveConnections((prevList) => {
      return areConnectionsEqual(prevList, newList) ? prevList : newList;
    });
  }, [favoriteConnections, nonFavoriteConnections, connectionManager]);

  useEffect(() => {
    // initial sync
    updateList();
  }, [updateList]);

  useEffect(() => {
    // on changes
    updateList();
  }, [favoriteConnections, nonFavoriteConnections, updateList]);

  useEffect(() => {
    // subscribe to events
    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.on(event, updateList);
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.off(event, updateList);
      }
    };
  }, [updateList, connectionManager]);

  return activeConnections;
}
