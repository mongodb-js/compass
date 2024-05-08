import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useEffect, useRef, useState } from 'react';
import type { ConnectionsManager } from '../provider';
import {
  ConnectionsManagerEvents,
  useConnectionRepository,
  useConnectionsManagerContext,
  areConnectionsEqual,
} from '../provider';

function pickActiveConnections(
  favoriteConnections: ConnectionInfo[],
  nonFavoriteConnections: ConnectionInfo[],
  connectionManager: ConnectionsManager
) {
  return [...favoriteConnections, ...nonFavoriteConnections].filter(
    ({ id }) => connectionManager.statusOf(id) === 'connected'
  );
}

export function useActiveConnections(): ConnectionInfo[] {
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionsManager = useConnectionsManagerContext();
  const { favoriteConnections, nonFavoriteConnections } =
    useConnectionRepository();
  const [activeConnections, setActiveConnections] = useState<ConnectionInfo[]>(
    () => {
      return pickActiveConnections(
        favoriteConnections,
        nonFavoriteConnections,
        connectionsManager
      );
    }
  );

  const updateListRef = useRef(() => {
    // We need a stable, always up to date, ref for update method. To make TS
    // happy, we initially assign a no-op and then immediately reassign with the
    // implementation instead of starting with undefined and a generic type
    // provided (otherwise we end up with `MutableRef` type that's harder to
    // account for on the call site)
  });
  updateListRef.current = () => {
    const newList = pickActiveConnections(
      favoriteConnections,
      nonFavoriteConnections,
      connectionsManager
    );

    setActiveConnections((prevList) => {
      return areConnectionsEqual(prevList, newList) ? prevList : newList;
    });
  };

  useEffect(() => {
    updateListRef.current();
  }, [favoriteConnections, nonFavoriteConnections]);

  useEffect(() => {
    const updateOnStatusChange = () => {
      updateListRef.current();
    };

    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionsManager.on(event, updateOnStatusChange);
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionsManager.off(event, updateOnStatusChange);
      }
    };
  }, [connectionsManager]);

  return activeConnections;
}
