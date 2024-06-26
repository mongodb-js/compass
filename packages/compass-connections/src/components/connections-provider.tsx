import React, { useContext, useEffect, useRef } from 'react';
import { useConnectionsManagerContext } from '../provider';
import { useConnections as useConnectionsStore } from '../stores/connections-store';
import { useConnectionRepository as useConnectionsRepositoryState } from '../hooks/use-connection-repository';
import { createServiceLocator } from 'hadron-app-registry';

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
  return (
    <ConnectionsStoreContext.Provider value={connectionsStore}>
      {children}
    </ConnectionsStoreContext.Provider>
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

export const connectionRepositoryLocator = createServiceLocator(
  useConnectionRepository.bind(null),
  'createConnectionRepositoryLocator'
);

export type ConnectionRepository = ReturnType<typeof useConnectionRepository>;
export { areConnectionsEqual } from '../hooks/use-connection-repository';
