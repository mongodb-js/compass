import { createContext, useContext, useRef } from 'react';
import type { ConnectionInfo, ConnectionStorage } from './renderer';
import { createServiceLocator } from 'hadron-app-registry';

export const ConnectionStorageContext = createContext<
  typeof ConnectionStorage | null
>(null);

export { type ConnectionStorage } from './renderer';

export type ConnectionInfoAccess = {
  getCurrentConnectionInfo(): ConnectionInfo;
};

// TODO(COMPASS-7397): storage context should not be leaking out of the service
// provider export, but the way the connection plugin is currently implemented
// prevents us from avoiding this
export function useConnectionStorageContext() {
  const connectionStorage = useContext(ConnectionStorageContext);
  if (!connectionStorage) {
    throw new Error(
      'Could not find the current ConnectionStorage. Did you forget to setup the ConnectionStorageContext?'
    );
  }
  return connectionStorage;
}

export const connectionStorageLocator = createServiceLocator(
  useConnectionStorageContext,
  'connectionStorageLocator'
);

const ConnectionInfoContext = createContext<ConnectionInfo | null>(null);
export function useConnectionInfo() {
  const connectionInfo = useContext(ConnectionInfoContext);
  if (!connectionInfo) {
    throw new Error(
      'Could not find the current ConnectionInfo. Did you forget to setup the ConnectionInfoContext?'
    );
  }
  return connectionInfo;
}
export const ConnectionInfoProvider = ConnectionInfoContext.Provider;
export const connectionInfoAccessLocator = createServiceLocator(
  function connectionInfoAccessLocator(): ConnectionInfoAccess {
    const connectionInfo = useConnectionInfo();
    const connectionInfoRef = useRef(connectionInfo);
    connectionInfoRef.current = connectionInfo;
    return {
      getCurrentConnectionInfo() {
        return connectionInfoRef.current;
      },
    };
  },
  'connectionInfoAccessLocator'
);
