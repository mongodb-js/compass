import { usePreference } from 'compass-preferences-model/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';
import { merge } from 'lodash';
import isEqual from 'lodash/isEqual';
import {
  ConnectionStorageEvents,
  useConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import { useState, useEffect, useCallback } from 'react';
import { BSON } from 'bson';

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PartialConnectionInfo = DeepPartial<ConnectionInfo> &
  Pick<ConnectionInfo, 'id'>;

/**
 * Same as _.isEqual but taking into consideration BSON values.
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
  saveConnection: (info: PartialConnectionInfo) => Promise<ConnectionInfo>;
  deleteConnection: (info: ConnectionInfo) => Promise<void>;
  getConnectionInfoById: (
    id: ConnectionInfo['id']
  ) => ConnectionInfo | undefined;
};

export function useConnectionRepository(): ConnectionRepository {
  const storage = useConnectionStorageContext();

  const [favoriteConnections, setFavoriteConnections] = useState<
    ConnectionInfo[]
  >([]);

  const [nonFavoriteConnections, setNonFavoriteConnections] = useState<
    ConnectionInfo[]
  >([]);

  const [autoConnectInfo, setAutoConnectInfo] = useState<
    ConnectionInfo | undefined
  >(undefined);

  const persistOIDCTokens = usePreference('persistOIDCTokens');

  useEffect(() => {
    async function updateListsOfConnections() {
      const allConnections = (await storage.loadAll()) || [];
      const favoriteConnections = allConnections
        .filter((connection) => connection.savedConnectionType === 'favorite')
        .sort(sortedAlphabetically);

      const nonFavoriteConnections = allConnections
        .filter(
          ({ savedConnectionType }) =>
            savedConnectionType !== 'favorite' &&
            savedConnectionType !== 'autoConnectInfo'
        )
        .sort(sortedAlphabetically);

      const autoConnectInfo = allConnections.find(
        ({ savedConnectionType }) => savedConnectionType === 'autoConnectInfo'
      );

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

      if (autoConnectInfo) {
        setAutoConnectInfo((prevAutoConnectInfo) => {
          if (prevAutoConnectInfo?.id !== autoConnectInfo.id) {
            return autoConnectInfo;
          } else {
            return prevAutoConnectInfo;
          }
        });
      }
    }

    void updateListsOfConnections();

    function updateListsOfConnectionsSubscriber() {
      void updateListsOfConnections();
    }

    storage.on(
      ConnectionStorageEvents.ConnectionsChanged,
      updateListsOfConnectionsSubscriber
    );

    return () => {
      storage.off(
        ConnectionStorageEvents.ConnectionsChanged,
        updateListsOfConnectionsSubscriber
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

      if (!persistOIDCTokens) {
        if (infoToSave.connectionOptions.oidc?.serializedState) {
          infoToSave.connectionOptions.oidc.serializedState = undefined;
        }
      }

      await storage.save?.({ connectionInfo: infoToSave });
      return infoToSave;
    },
    [storage, persistOIDCTokens]
  );

  const deleteConnection = useCallback(
    async (info: ConnectionInfo) => {
      await storage.delete?.(info);
    },
    [storage]
  );

  const getConnectionInfoById = useCallback(
    (connectionInfoId: ConnectionInfo['id']) => {
      const allConnections = [
        ...favoriteConnections,
        ...nonFavoriteConnections,
        ...(autoConnectInfo ? [autoConnectInfo] : []),
      ];
      return allConnections.find(({ id }) => id === connectionInfoId);
    },
    [favoriteConnections, nonFavoriteConnections, autoConnectInfo]
  );
  return {
    getConnectionInfoById,
    favoriteConnections,
    nonFavoriteConnections,
    saveConnection,
    deleteConnection,
  };
}
