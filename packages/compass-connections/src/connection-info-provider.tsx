import React, { createContext, useContext, useState } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';
import {
  ConnectionsStoreContext,
  useConnectionForId,
  useConnectionInfoRefForId,
} from './stores/store-context';
import type { ConnectionId } from './stores/connections-store-redux';

export type { ConnectionInfo };

export type ConnectionInfoAccess = {
  getCurrentConnectionInfo(): ConnectionInfo;
};

const ConnectionInfoContext = createContext<ConnectionInfo | null>(null);

const ConnectionIdContext = createContext<ConnectionId | null>(null);

/**
 * @deprecated define connection for your test separately
 */
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
  connectionInfoId: string;
  children?:
    | ((connectionInfo: ConnectionInfo) => React.ReactNode)
    | React.ReactNode;
}> = createServiceProvider(function ConnectionInfoProvider({
  connectionInfoId,
  children,
}) {
  const connection = useConnectionForId(connectionInfoId);
  const isConnected = connection?.status === 'connected';
  return isConnected ? (
    <ConnectionIdContext.Provider value={connection.info.id}>
      <ConnectionInfoContext.Provider value={connection.info}>
        {typeof children === 'function' ? children(connection.info) : children}
      </ConnectionInfoContext.Provider>
    </ConnectionIdContext.Provider>
  ) : null;
});

/**
 * @deprecated use `useConnectionInfoRef` instead
 */
export const useConnectionInfoAccess = (): ConnectionInfoAccess => {
  let connectionId = useContext(ConnectionIdContext);
  if (!connectionId) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'Could not find the current ConnectionInfo. Did you forget to setup the ConnectionInfoContext?'
      );
    }
    connectionId = TEST_CONNECTION_INFO.id;
  }
  // TODO: remove when all tests are using new testing helpers
  if (!useContext(ConnectionsStoreContext) && process.env.NODE_ENV === 'test') {
    return {
      getCurrentConnectionInfo() {
        return TEST_CONNECTION_INFO;
      },
    };
  }
  // This is stable in all environments
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const connectionInfoRef = useConnectionInfoRefForId(connectionId);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [access] = useState(() => {
    // Return the function from useState to make sure the value doesn't change
    // when component re-renders
    return {
      getCurrentConnectionInfo() {
        if (!connectionInfoRef.current) {
          if (process.env.NODE_ENV !== 'test') {
            throw new Error(
              'Could not find the current ConnectionInfo. Did you forget to setup the ConnectionInfoContext?'
            );
          }
          return TEST_CONNECTION_INFO;
        }
        return connectionInfoRef.current;
      },
    };
  });
  return access;
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

/**
 * @deprecated instead of using HOC, refactor class component to functional
 * component
 */
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
