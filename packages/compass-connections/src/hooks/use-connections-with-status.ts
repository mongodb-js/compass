import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConnectionStatus, ConnectionInfo } from '../provider';
import {
  ConnectionsManagerEvents,
  useConnectionRepository,
  useConnectionsManagerContext,
  areConnectionsEqual,
} from '../provider';

type ConnectionInfoWithStatus = {
  connectionInfo: ConnectionInfo;
  connectionStatus: ConnectionStatus;
};

export function useConnectionInfoStatus(
  connectionId: string
): ConnectionStatus | null {
  const connectionsManager = useConnectionsManagerContext();
  const [status, setStatus] = useState(() => {
    return connectionsManager.statusOf(connectionId);
  });
  useEffect(() => {
    const updateOnStatusChange = () => {
      setStatus(connectionsManager.statusOf(connectionId));
    };
    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionsManager.on(event, updateOnStatusChange);
    }
    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionsManager.off(event, updateOnStatusChange);
      }
    };
  }, [connectionId, connectionsManager]);
  return status;
}

export function useConnectionsWithStatus(): ConnectionInfoWithStatus[] {
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionsManager = useConnectionsManagerContext();
  const { favoriteConnections, nonFavoriteConnections, autoConnectInfo } =
    useConnectionRepository();
  const allConnections = useMemo(() => {
    return favoriteConnections.concat(
      nonFavoriteConnections,
      autoConnectInfo ? autoConnectInfo : []
    );
  }, [favoriteConnections, nonFavoriteConnections, autoConnectInfo]);

  const [connectionsWithStatus, setConnectionsWithStatus] = useState<
    ConnectionInfoWithStatus[]
  >(() => {
    return allConnections.map((connection) => {
      return {
        connectionInfo: connection,
        connectionStatus: connectionsManager.statusOf(connection.id),
      };
    });
  });

  const updateListRef = useRef(() => {
    // We need a stable, always up to date, ref for update method. To make TS
    // happy, we initially assign a no-op and then immediately reassign with the
    // implementation instead of starting with undefined and a generic type
    // provided (otherwise we end up with `MutableRef` type that's harder to
    // account for on the call site)
  });
  updateListRef.current = () => {
    const newConnectionsList = allConnections.map((connection) => {
      return {
        connectionInfo: connection,
        connectionStatus: connectionsManager.statusOf(connection.id),
      };
    });
    setConnectionsWithStatus((prevList) => {
      return areConnectionsEqual<ConnectionInfoWithStatus>(
        prevList,
        newConnectionsList
      )
        ? prevList
        : newConnectionsList;
    });
  };

  useEffect(() => {
    updateListRef.current();
  }, [favoriteConnections, nonFavoriteConnections, autoConnectInfo]);

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

  return connectionsWithStatus;
}
