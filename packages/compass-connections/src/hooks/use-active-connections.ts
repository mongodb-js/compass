import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useCallback, useEffect, useState } from 'react';
import { BSON } from 'bson';
import { useConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManagerEvents,
  useConnectionsManagerContext,
} from '../provider';
import isEqual from 'lodash/isEqual';
import { ConnectionStorageEvents } from '@mongodb-js/connection-storage/renderer';
import {
  areConnectionsEqual,
  useConnectionRepository,
} from './use-connection-repository';
import { useEffectOnChange } from '@mongodb-js/compass-components';

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

  useEffectOnChange(() => {
    updateList();
  }, [favoriteConnections, nonFavoriteConnections]);

  useEffect(() => {
    updateList();

    // reacting to connection status updates
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
