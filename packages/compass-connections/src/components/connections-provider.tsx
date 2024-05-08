import React, { useContext, useEffect, useRef } from 'react';
import { useConnectionsManagerContext } from '../provider';
import { useConnections as useConnectionsStore } from '../stores/connections-store';

const ConnectionsStoreContext = React.createContext<ReturnType<
  typeof useConnectionsStore
> | null>(null);

type UseConnectionsParams = Parameters<typeof useConnectionsStore>[0];

export const ConnectionsProvider: React.FunctionComponent<
  UseConnectionsParams
> = ({ children, ...useConnectionsParams }) => {
  const connectionsManagerRef = useRef(useConnectionsManagerContext());
  const connectionsStore = useConnectionsStore(useConnectionsParams);
  useEffect(() => {
    const cm = connectionsManagerRef.current;
    return () => {
      void cm.closeAllConnections();
    };
  }, []);
  return (
    <ConnectionsStoreContext.Provider value={connectionsStore}>
      {children}
    </ConnectionsStoreContext.Provider>
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
