import React, { createContext, useContext, useRef } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';
import {
  ConnectionStatus,
  connectionsManagerLocator,
  useConnectionRepository,
} from './provider';

export type { ConnectionInfo };

export type ConnectionInfoAccess = {
  getCurrentConnectionInfo(): ConnectionInfo;
};

const ConnectionInfoContext = createContext<ConnectionInfo | null>(null);
export const TEST_CONNECTION_INFO: ConnectionInfo = {
  id: 'TEST',
  connectionOptions: {
    connectionString: 'mongodb://localhost:27020',
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
  const connectionsManager = connectionsManagerLocator();
  const isConnected =
    connectionInfo &&
    connectionsManager.statusOf(connectionInfo.id) ===
      ConnectionStatus.Connected;
  return isConnected && connectionInfo ? (
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

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

function withConnectionInfoAccess<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(
  ReactComponent: T
): React.FunctionComponent<Omit<FirstArgument<T>, 'connectionInfoAccess'>> {
  const WithConnectionInfoAccess = (
    props: Omit<FirstArgument<T>, 'connectionInfoAccess'> & React.Attributes
  ) => {
    const connectionInfoAccess = useConnectionInfoAccess();
    return React.createElement(ReactComponent, {
      ...props,
      connectionInfoAccess,
    });
  };
  return WithConnectionInfoAccess;
}

export { withConnectionInfoAccess };
