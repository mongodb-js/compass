import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useCallback, useEffect, useState } from 'react';
import { BSON } from 'bson';
import { useConnectionRepositoryContext } from '@mongodb-js/connection-storage/provider';
import {
  ConnectionsManagerEvents,
  useConnectionsManagerContext,
} from '../provider';
import isEqual from 'lodash/isEqual';

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
    if (!areConnectionsEqual(activeConnections, list)) {
      setActiveConnections(list);
    }
  }, [activeConnections]);

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
