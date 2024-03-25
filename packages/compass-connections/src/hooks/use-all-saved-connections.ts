import { type ConnectionInfo } from '@mongodb-js/connection-info';
import {
  useConnectionRepositoryContext,
  useConnectionStorageContext,
} from '@mongodb-js/connection-storage/provider';
import { ConnectionStorageEvents } from '@mongodb-js/connection-storage/renderer';
import { useState, useEffect } from 'react';

export function useAllSavedConnections(): {
  favorites: ConnectionInfo[];
  nonFavorites: ConnectionInfo[];
} {
  const repository = useConnectionRepositoryContext();
  const connectionStorage = useConnectionStorageContext();

  const [favorites, setFavorites] = useState<ConnectionInfo[]>([]);
  const [nonFavorites, setNonFavorites] = useState<ConnectionInfo[]>([]);

  useEffect(
    function () {
      async function loadConnections(): Promise<void> {
        const [fav, nonFav] = await Promise.all([
          repository.listFavoriteConnections(),
          repository.listNonFavoriteConnections?.() ?? Promise.resolve([]),
        ]);

        setFavorites(fav);
        setNonFavorites(nonFav);
      }

      function reloadConnections(): void {
        void loadConnections();
      }

      reloadConnections();

      connectionStorage.events.on(
        ConnectionStorageEvents.ConnectionsChanged,
        reloadConnections
      );

      return () => {
        connectionStorage.events.off(
          ConnectionStorageEvents.ConnectionsChanged,
          reloadConnections
        );
      };
    },
    [repository, setFavorites, setNonFavorites]
  );

  return { favorites, nonFavorites };
}
