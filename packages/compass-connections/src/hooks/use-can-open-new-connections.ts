import { useConnectionRepositoryContext } from '@mongodb-js/connection-storage/provider';
import { useConnectionsManagerContext } from '../provider';
import {
  type ConnectionStatus,
  ConnectionsManagerEvents,
} from '../connections-manager';

import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { useEffect, useState } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import { useAllSavedConnections } from './use-all-saved-connections';

export type CanNotOpenConnectionReason = 'maximum-number-exceeded';

export function useCanOpenNewConnections(): {
  numberOfConnectionsOpen: number;
  maximumNumberOfConnectionsOpen: number;
  canOpenNewConnection: boolean;
  canNotOpenReason?: CanNotOpenConnectionReason;
} {
  const connectionManager = useConnectionsManagerContext();

  const { favorites, nonFavorites } = useAllSavedConnections();
  const maximumNumberOfConnectionsOpen = usePreference(
    'userCanHaveMaximumNumberOfActiveConnections'
  );

  const [numberOfConnectionsOpen, setNumberOfConnectionsOpen] = useState(0);
  const [canOpenNewConnection, setCanOpenNewConnection] = useState(false);
  const [canNotOpenReason, setCanNotOpenReason] = useState<
    CanNotOpenConnectionReason | undefined
  >(undefined);

  useEffect(() => {
    function refreshFilterStatus() {
      let openConnections = 0;
      for (const { id } of [...favorites, ...nonFavorites]) {
        if (connectionManager.statusOf(id) === 'connected') {
          openConnections++;
        }
      }

      const canOpen = openConnections < maximumNumberOfConnectionsOpen;
      const canNotOpenReason = !canOpen ? 'maximum-number-exceeded' : undefined;

      setNumberOfConnectionsOpen(openConnections);
      setCanOpenNewConnection(canOpen);
      setCanNotOpenReason(canNotOpenReason);
    }

    refreshFilterStatus();

    for (const event of Object.values(ConnectionsManagerEvents)) {
      connectionManager.on(event, refreshFilterStatus);
    }

    return () => {
      for (const event of Object.values(ConnectionsManagerEvents)) {
        connectionManager.off(event, refreshFilterStatus);
      }
    };
  }, [
    connectionManager,
    favorites,
    nonFavorites,
    maximumNumberOfConnectionsOpen,
  ]);

  return {
    numberOfConnectionsOpen,
    maximumNumberOfConnectionsOpen,
    canOpenNewConnection,
    canNotOpenReason,
  };
}
