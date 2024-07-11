import { usePreference } from 'compass-preferences-model/provider';
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';
import { merge } from 'lodash';
import isEqual from 'lodash/isEqual';
import {
  ConnectionStorageEvents,
  useConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import { useState, useEffect, useCallback } from 'react';
import { BSON } from 'bson';
import type { ActiveAndInactiveConnectionsCount } from '../types';

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PartialConnectionInfo = DeepPartial<ConnectionInfo> &
  Pick<ConnectionInfo, 'id'>;

/**
 * Same as _.isEqual but taking into consideration BSON values.
 */
export function areConnectionsEqual<T>(listA: T[], listB: T[]): boolean {
  return isEqual(
    listA.map((a: any) => BSON.serialize(a)),
    listB.map((b: any) => BSON.serialize(b))
  );
}

function ensureWellFormedConnectionString(connectionString: string) {
  new ConnectionString(connectionString);
}

function sortedAlphabetically(a: ConnectionInfo, b: ConnectionInfo): number {
  const aTitle = getConnectionTitle(a).toLocaleLowerCase();
  const bTitle = getConnectionTitle(b).toLocaleLowerCase();
  return aTitle.localeCompare(bTitle);
}

export type ConnectionRepository = {
  favoriteConnections: ConnectionInfo[];
  nonFavoriteConnections: ConnectionInfo[];
  autoConnectInfo?: ConnectionInfo;
  saveConnection: (info: PartialConnectionInfo) => Promise<ConnectionInfo>;
  deleteConnection: (info: ConnectionInfo) => Promise<void>;
  getConnectionInfoById: (
    id: ConnectionInfo['id']
  ) => ConnectionInfo | undefined;
  getConnectionTitleById: (id: ConnectionInfo['id']) => string | undefined;
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
      let prevConnections: ConnectionInfo[] = [];

      const newFavoriteConnections = allConnections
        .filter((connection) => connection.savedConnectionType === 'favorite')
        .sort(sortedAlphabetically);

      const newNonFavoriteConnections = allConnections
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
        prevConnections = [...prevList];
        if (areConnectionsEqual(prevList, newFavoriteConnections)) {
          return prevList;
        } else {
          return newFavoriteConnections;
        }
      });

      setNonFavoriteConnections((prevList) => {
        prevConnections = [...prevConnections, ...prevList];
        if (areConnectionsEqual(prevList, newNonFavoriteConnections)) {
          return prevList;
        } else {
          return newNonFavoriteConnections;
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

  const getConnectionTitleById = useCallback(
    (connectionId: ConnectionInfo['id']) => {
      const connectionInfo = getConnectionInfoById(connectionId);
      if (connectionInfo) {
        return getConnectionTitle(connectionInfo);
      }
    },
    [getConnectionInfoById]
  );
  return {
    getConnectionInfoById,
    getConnectionTitleById,
    favoriteConnections,
    nonFavoriteConnections,
    autoConnectInfo,
    saveConnection,
    deleteConnection,
  };
}
