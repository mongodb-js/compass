import React, { createContext, useContext, useRef } from 'react';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';
import {
  useConnectionForId,
  useConnectionInfoForId,
  useConnectionInfoRefForId,
} from './stores/store-context';
import type {
  ConnectionId,
  ConnectionState,
} from './stores/connections-store-redux';

export type { ConnectionInfo };

const ConnectionIdContext = createContext<ConnectionId | null>(null);

/**
 * @internal never to be used outside of the test environment or re-exported
 * from this package
 */
export const TestEnvCurrentConnectionContext =
  createContext<ConnectionState | null>(null);

export const ConnectionInfoProvider: React.FC<{
  connectionInfoId: string;
  children?:
    | ((connectionInfo: ConnectionInfo) => React.ReactNode)
    | React.ReactNode;
}> = createServiceProvider(function ConnectionInfoProvider({
  connectionInfoId,
  children,
}) {
  const connectionFromState = useConnectionForId(connectionInfoId);
  const testEnvConnection = useContext(TestEnvCurrentConnectionContext);
  const connection = connectionFromState ?? testEnvConnection;
  const isConnected = connection?.status === 'connected';
  return isConnected ? (
    <ConnectionIdContext.Provider value={connection.info.id}>
      {typeof children === 'function' ? children(connection.info) : children}
    </ConnectionIdContext.Provider>
  ) : null;
});

/**
 * Returns the value of the connectionInfo that is applied to the current scope
 * (part of the React rendering tree). Throws if connection info doesn't exist
 */
export function useConnectionInfo() {
  const connectionId = useContext(ConnectionIdContext);
  const testEnvConnection = useContext(TestEnvCurrentConnectionContext);
  const connectionInfoFromState = useConnectionInfoForId(connectionId ?? '');
  const connectionInfo = connectionInfoFromState ?? testEnvConnection?.info;
  if (!connectionInfo) {
    throw new Error(
      'Can not access connection info inside a `useConnectionInfo` hook. Make sure that you are only calling this hook inside connected application scope'
    );
  }
  return connectionInfo;
}

export type ConnectionInfoRef = {
  readonly current: ConnectionInfo & { title: string };
};

/**
 * Returns a stable ref object with the value of the connectionInfo that is
 * applied to the current scope (part of the React rendering tree). Throws if
 * connection info doesn't exist
 */
export const useConnectionInfoRef = () => {
  const connectionId = useContext(ConnectionIdContext);
  const testEnvConnection = useContext(TestEnvCurrentConnectionContext);
  const testEnvConnectionRef = useRef(testEnvConnection?.info);
  testEnvConnectionRef.current = testEnvConnection?.info;
  const connectionInfoRefFromStore = useConnectionInfoRefForId(
    connectionId ?? ''
  );
  const connectionInfoRef = connectionInfoRefFromStore.current
    ? connectionInfoRefFromStore
    : testEnvConnectionRef;
  if (!connectionInfoRef.current) {
    throw new Error(
      'Can not access connection info inside a `useConnectionInfoRef` hook. Make sure that you are only calling this hook inside connected application scope'
    );
  }
  return connectionInfoRef as ConnectionInfoRef;
};

export const connectionInfoRefLocator = createServiceLocator(
  useConnectionInfoRef,
  'connectionInfoRefLocator'
);
