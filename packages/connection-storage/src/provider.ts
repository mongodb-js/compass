import { createContext, createElement, useMemo, useContext } from 'react';
import { ConnectionRepository } from './connection-repository';
import type { ConnectionStorage } from './renderer';

export const ConnectionStorageContext = createContext<
  typeof ConnectionStorage | null
>(null);

export function connectionStorageLocator(): typeof ConnectionStorage {
  const connectionStorage = useContext(ConnectionStorageContext);
  if (!connectionStorage) {
    throw new Error(
      'Could not find the current ConnectionStorage. Did you forget to setup the ConnectionStorageContext?'
    );
  }

  return connectionStorage;
}

export const ConnectionRepositoryContext =
  createContext<ConnectionRepository | null>(null);

export const ConnectionRepositoryContextProvider: React.FunctionComponent<
  object
> = ({ children }) => {
  const storage = connectionStorageLocator();
  const value = useMemo(() => new ConnectionRepository(storage), [storage]);

  return createElement(ConnectionRepositoryContext.Provider, {
    value,
    children,
  });
};

export function connectionRepositoryLocator(): ConnectionRepository {
  const connectionRepository = useContext(ConnectionRepositoryContext);
  if (!connectionRepository) {
    throw new Error(
      'Could not find the current ConnectionRepository. Did you forget to setup the ConnectionRepositoryContext?'
    );
  }

  return connectionRepository;
}
