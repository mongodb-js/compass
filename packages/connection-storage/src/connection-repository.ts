import { createElement, useMemo, useContext } from 'react';
import { createContext } from 'react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { type ConnectionStorage, connectionStorageLocator } from './renderer';
import ConnectionString from 'mongodb-connection-string-url';
import { merge } from 'lodash';

type ConnectionStorageFacade = Pick<
  typeof ConnectionStorage,
  'loadAll' | 'load' | 'save' | 'delete'
>;

export class ConnectionRepository {
  // We would inject a specific implementation for Compass and Data Explorer
  constructor(private readonly storage: ConnectionStorageFacade) {}

  async listFavoriteConnections(): Promise<ConnectionInfo[]> {
    const allConnections = await this.storage.loadAll();
    return allConnections
      .filter((connection) => connection.savedConnectionType === 'favorite')
      .sort(ConnectionRepository.sortedAlphabetically);
  }

  async listNonFavoriteConnections(): Promise<ConnectionInfo[]> {
    const allConnections = await this.storage.loadAll();
    return allConnections
      .filter(
        (connection) =>
          connection.savedConnectionType === 'recent' ||
          !connection.savedConnectionType
      )
      .sort(ConnectionRepository.sortedAlphabetically);
  }

  async saveConnection(info: ConnectionInfo): Promise<ConnectionInfo> {
    const oldConnectionInfo = await this.storage.load({ id: info.id });
    const infoToSave = oldConnectionInfo
      ? merge(oldConnectionInfo, info)
      : info;

    this.ensureWellFormedConnectionString(
      infoToSave.connectionOptions?.connectionString
    );

    await this.storage.save({ connectionInfo: infoToSave });
    return infoToSave;
  }

  async deleteConnection(info: ConnectionInfo): Promise<void> {
    await this.storage.delete(info);
  }

  private ensureWellFormedConnectionString(connectionString: string) {
    new ConnectionString(connectionString);
  }

  private static sortedAlphabetically = (
    a: ConnectionInfo,
    b: ConnectionInfo
  ): number => {
    const aName = a.favorite?.name?.toLocaleLowerCase() || '';
    const bName = b.favorite?.name?.toLocaleLowerCase() || '';
    return aName.localeCompare(bName);
  };
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
