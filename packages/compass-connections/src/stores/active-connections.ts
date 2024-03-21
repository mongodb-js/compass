import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useCallback, useEffect, useState } from 'react';
import { BSON } from 'bson';
import {
  useConnectionRepositoryContext,
  useConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManagerEvents,
  useConnectionsManagerContext,
} from '../provider';
import isEqual from 'lodash/isEqual';
import { ConnectionStorageEvents } from '@mongodb-js/connection-storage/renderer';

/**
 * Same as _.isEqual, except it takes key order into account
 */
function areConnectionsEqual(
  listA: ConnectionInfo[],
  listB: ConnectionInfo[]
): boolean {
  return isEqual(
    listA.map((a: any) => BSON.serialize(a)),
    listB.map((b: any) => BSON.serialize(b))
  );
}

export function useActiveConnections(): ConnectionInfo[] {
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionManager = useConnectionsManagerContext();
  const connectionRepository = useConnectionRepositoryContext();
  const connectionStorage = useConnectionStorageContext();

  const [activeConnections, setActiveConnections] = useState<ConnectionInfo[]>(
    []
  );

  const updateList = useCallback(async () => {
    const list = [
      ...(await connectionRepository.listFavoriteConnections()),
      ...(await connectionRepository.listNonFavoriteConnections()),
    ].filter(({ id }) => connectionManager.statusOf(id) === 'connected');
    if (!areConnectionsEqual(activeConnections, list)) {
      setActiveConnections(list);
    }
  }, [activeConnections]);

  useEffect(() => {
    void updateList();

    // reacting to connection status updates
    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.on(event, () => void updateList());
    }

    // reacting to connection info updates
    connectionStorage.events?.on(
      ConnectionStorageEvents.ConnectionsChanged,
      () => void updateList
    );

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.off(event, () => void updateList());
      }
      connectionStorage.events?.off(
        ConnectionStorageEvents.ConnectionsChanged,
        () => void updateList
      );
    };
  }, [updateList]);

  return activeConnections;
}
