import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';
import { merge } from 'lodash';
import isEqual from 'lodash/isEqual';
import { ConnectionStorageEvents } from '@mongodb-js/connection-storage/renderer';
import { useConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import { useState, useEffect, useCallback } from 'react';
import { BSON } from 'bson';

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PartialConnectionInfo = DeepPartial<ConnectionInfo> &
  Pick<ConnectionInfo, 'id'>;

/**
 * Same as _.isEqual, except it takes key order into account
 */
export function areConnectionsEqual(
  listA: ConnectionInfo[],
  listB: ConnectionInfo[]
): boolean {
  return isEqual(
    listA.map((a: any) => BSON.serialize(a)),
    listB.map((b: any) => BSON.serialize(b))
  );
}

function ensureWellFormedConnectionString(connectionString: string) {
  new ConnectionString(connectionString);
}

function sortedAlphabetically(a: ConnectionInfo, b: ConnectionInfo): number {
  const aName = a.favorite?.name?.toLocaleLowerCase() || '';
  const bName = b.favorite?.name?.toLocaleLowerCase() || '';
  return aName.localeCompare(bName);
}

export type ConnectionRepository = {
  favoriteConnections: ConnectionInfo[];
  nonFavoriteConnections: ConnectionInfo[];
  saveConnection(info: PartialConnectionInfo): Promise<ConnectionInfo>;
  deleteConnection(info: ConnectionInfo): Promise<void>;
};

export function useConnectionRepository(): ConnectionRepository {
  const storage = useConnectionStorageContext();

  const [favoriteConnections, setFavoriteConnections] = useState<
    ConnectionInfo[]
  >([]);

  const [nonFavoriteConnections, setNonFavoriteConnections] = useState<
    ConnectionInfo[]
  >([]);

  useEffect(() => {
    async function updateListsOfConnections() {
      const allConnections = await storage.loadAll();
      const favoriteConnections = allConnections
        .filter((connection) => connection.savedConnectionType === 'favorite')
        .sort(sortedAlphabetically);

      const nonFavoriteConnections = allConnections
        .filter((connection) => connection.savedConnectionType !== 'favorite')
        .sort(sortedAlphabetically);

      setFavoriteConnections((prevList) => {
        if (areConnectionsEqual(prevList, favoriteConnections)) {
          return prevList;
        } else {
          return favoriteConnections;
        }
      });

      setNonFavoriteConnections((prevList) => {
        if (areConnectionsEqual(prevList, nonFavoriteConnections)) {
          return prevList;
        } else {
          return nonFavoriteConnections;
        }
      });
    }

    void updateListsOfConnections();

    storage.events.on(
      ConnectionStorageEvents.ConnectionsChanged,
      updateListsOfConnections
    );

    return () => {
      storage.events.off(
        ConnectionStorageEvents.ConnectionsChanged,
        updateListsOfConnections
      );
    };
  }, [storage]);

  const saveConnection = useCallback(
    async (info: PartialConnectionInfo) => {
      const oldConnectionInfo = await storage.load({ id: info.id });
      const infoToSave = (
        oldConnectionInfo ? merge(oldConnectionInfo, info) : info
      ) as ConnectionInfo;

      ensureWellFormedConnectionString(
        infoToSave.connectionOptions?.connectionString
      );

      await storage.save({ connectionInfo: infoToSave });
      return infoToSave;
    },
    [storage]
  );

  const deleteConnection = useCallback(
    async (info: ConnectionInfo) => {
      await storage.delete(info);
    },
    [storage]
  );

  return {
    favoriteConnections,
    nonFavoriteConnections,
    saveConnection,
    deleteConnection,
  };
}
