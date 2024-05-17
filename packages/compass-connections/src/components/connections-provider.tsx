import React, { useContext, useEffect, useRef } from 'react';
import {
  useActiveConnections,
  useConnectionsManagerContext,
} from '../provider';
import { useConnections as useConnectionsStore } from '../stores/connections-store';
import { useConnectionRepository as useConnectionsRepositoryState } from '../hooks/use-connection-repository';
import {
  ElectronMenuItem,
  ElectronSubMenu,
} from '@mongodb-js/react-electron-menu';
import { getConnectionTitle } from '@mongodb-js/connection-info';

const ConnectionsStoreContext = React.createContext<ReturnType<
  typeof useConnectionsStore
> | null>(null);

const ConnectionsRepositoryStateContext = React.createContext<ReturnType<
  typeof useConnectionsRepositoryState
> | null>(null);

type UseConnectionsParams = Parameters<typeof useConnectionsStore>[0];

const ConnectionsStoreProvider: React.FunctionComponent<
  UseConnectionsParams
> = ({ children, ...useConnectionsParams }) => {
  const connectionsStore = useConnectionsStore(useConnectionsParams);
  const activeConnections = useActiveConnections();

  return (
    <>
      {activeConnections.length > 0 && (
        <ElectronSubMenu label="&Connect">
          {activeConnections.map((connectionInfo) => {
            return (
              <ElectronSubMenu
                key={connectionInfo.id}
                label={getConnectionTitle(connectionInfo)}
              >
                <ElectronMenuItem
                  label="Disconnect"
                  onClick={() => {
                    void connectionsStore.closeConnection(connectionInfo.id);
                  }}
                ></ElectronMenuItem>
                <ElectronMenuItem
                  label="Copy Connection String"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      connectionInfo.connectionOptions.connectionString
                    );
                  }}
                ></ElectronMenuItem>
              </ElectronSubMenu>
            );
          })}
        </ElectronSubMenu>
      )}
      <ConnectionsStoreContext.Provider value={connectionsStore}>
        {children}
      </ConnectionsStoreContext.Provider>
    </>
  );
};

export const ConnectionsProvider: React.FunctionComponent<
  UseConnectionsParams
> = ({ children, ...useConnectionsParams }) => {
  const connectionsManagerRef = useRef(useConnectionsManagerContext());
  const connectionsRepositoryState = useConnectionsRepositoryState();
  useEffect(() => {
    const cm = connectionsManagerRef.current;
    return () => {
      void cm.closeAllConnections();
    };
  }, []);
  return (
    <ConnectionsRepositoryStateContext.Provider
      value={connectionsRepositoryState}
    >
      <ConnectionsStoreProvider {...useConnectionsParams}>
        {children}
      </ConnectionsStoreProvider>
    </ConnectionsRepositoryStateContext.Provider>
  );
};

export function useConnections() {
  const store = useContext(ConnectionsStoreContext);
  if (!store) {
    // TODO(COMPASS-7879): implement a default provider in test methods
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useConnectionsStore();
    }
    throw new Error(
      'Can not use useConnections outside of ConnectionsProvider component'
    );
  }
  return store;
}

export function useConnectionRepository() {
  const repository = useContext(ConnectionsRepositoryStateContext);
  if (!repository) {
    // TODO(COMPASS-7879): implement a default provider in test methods
    if (process.env.NODE_ENV === 'test') {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useConnectionsRepositoryState();
    }
    throw new Error(
      'Can not use useConnectionRepository outside of ConnectionsProvider component'
    );
  }
  return repository;
}

export type ConnectionRepository = ReturnType<typeof useConnectionRepository>;
export { areConnectionsEqual } from '../hooks/use-connection-repository';
