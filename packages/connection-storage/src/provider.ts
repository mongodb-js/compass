import { createContext, createElement, useMemo, useContext } from 'react';
import { ConnectionRepository } from './connection-repository';
import type { ConnectionInfo, ConnectionStorage } from './renderer';
import {
  createServiceLocator,
  createServiceProvider,
} from 'hadron-app-registry';

export const ConnectionStorageContext = createContext<
  typeof ConnectionStorage | null
>(null);

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

export const ConnectionRepositoryContext =
  createContext<ConnectionRepository | null>(null);

export const ConnectionRepositoryContextProvider: React.FunctionComponent<object> =
  createServiceProvider(function ConnectionRepositoryContextProvider({
    children,
  }) {
    const storage = connectionStorageLocator();
    const value = useMemo(() => new ConnectionRepository(storage), [storage]);

    return createElement(ConnectionRepositoryContext.Provider, {
      value,
      children,
    });
  });

// TODO(COMPASS-7397): see above
export function useConnectionRepositoryContext() {
  const connectionRepository = useContext(ConnectionRepositoryContext);
  if (!connectionRepository) {
    throw new Error(
      'Could not find the current ConnectionRepository. Did you forget to setup the ConnectionRepositoryContext?'
    );
  }
  return connectionRepository;
}

export const connectionRepositoryLocator = createServiceLocator(
  useConnectionRepositoryContext,
  'connectionRepositoryLocator'
);

const ConnectionInfoContext = createContext<ConnectionInfo | null>(null);
function useConnectionInfoContext() {
  const connectionInfo = useContext(ConnectionInfoContext);
  if (!connectionInfo) {
    throw new Error(
      'Could not find the current ConnectionInfo. Did you forget to setup the ConnectionInfoContext?'
    );
  }
  return connectionInfo;
}
export const ConnectionInfoProvider = ConnectionInfoContext.Provider;
export const connectionInfoLocator = createServiceLocator(
  useConnectionInfoContext,
  'connectionInfoLocator'
);
