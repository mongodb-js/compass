import React, { createContext, useContext, useRef } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';
import { useConnectionRepository } from './provider';

export type { ConnectionInfo };

export type ConnectionInfoAccess = {
  getCurrentConnectionInfo(): ConnectionInfo;
};

const ConnectionInfoContext = createContext<ConnectionInfo | null>(null);
export const TEST_CONNECTION_INFO: ConnectionInfo = {
  id: 'TEST',
  connectionOptions: {
    connectionString: 'test-connection-string',
  },
};
export function useConnectionInfo() {
  const connectionInfo = useContext(ConnectionInfoContext);
  if (!connectionInfo) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'Could not find the current ConnectionInfo. Did you forget to setup the ConnectionInfoContext?'
      );
    }
    return TEST_CONNECTION_INFO;
  }
  return connectionInfo;
}
export const ConnectionInfoProvider: React.FC<{
  connectionInfoId?: string;
  children?:
    | ((connectionInfo: ConnectionInfo) => React.ReactNode)
    | React.ReactNode;
}> = createServiceProvider(function ConnectionInfoProvider({
  connectionInfoId,
  children,
}) {
  const { getConnectionInfoById } = useConnectionRepository();
  const connectionInfo = connectionInfoId
    ? getConnectionInfoById(connectionInfoId)
    : undefined;
  return connectionInfo ? (
    <ConnectionInfoContext.Provider value={connectionInfo}>
      {typeof children === 'function' ? children(connectionInfo) : children}
    </ConnectionInfoContext.Provider>
  ) : null;
});
export const useConnectionInfoAccess = (): ConnectionInfoAccess => {
  const connectionInfo = useConnectionInfo();
  const connectionInfoRef = useRef(connectionInfo);
  connectionInfoRef.current = connectionInfo;
  return {
    getCurrentConnectionInfo() {
      return connectionInfoRef.current;
    },
  };
};
export const connectionInfoAccessLocator = createServiceLocator(
  useConnectionInfoAccess,
  'connectionInfoAccessLocator'
);
