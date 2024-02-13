import { ConnectionInfo } from '@mongodb-js/connection-info';
import { ConnectionStorage } from './connection-storage';
import ConnectionString from 'mongodb-connection-string-url';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'failed';
export type StatusAwareConnectionInfo = Omit<
  ConnectionInfo & {
    status: ConnectionStatus;
  },
  'favorite'
>;

/**
 * Exposes an interface that will be implemented for each deployment environment to
 * get access to the connections on that environment. For Compass Desktop, it will
 * rely on the ConnectionStorage, for the Data Explorer, on the Atlas API (or another
 * facade on top of that).
 */
export interface ConnectionProvider {
  listConnections(): Promise<StatusAwareConnectionInfo[]>;
  listConnectionHistory?(): Promise<StatusAwareConnectionInfo[]>;
  saveConnection?(info: ConnectionInfo): Promise<StatusAwareConnectionInfo>;
  deleteConnection?(info: ConnectionInfo): Promise<void>;
}

export class DesktopConnectionProvider implements ConnectionProvider {
  // Inject the type as it would be an instance (this is literally injecting the singleton)
  // in case we want to change how ConnectionStorage works in the future.
  constructor(private readonly storage: typeof ConnectionStorage) {}

  async listConnections(): Promise<StatusAwareConnectionInfo[]> {
    const allConnections = await this.storage.loadAll();
    return allConnections
      .filter((connection) => connection.userFavorite)
      .sort(this.sortedAlphabetically)
      .map((connection) => ({
        ...connection,
        status: 'disconnected',
      }));
  }

  async listConnectionHistory(): Promise<StatusAwareConnectionInfo[]> {
    const allConnections = await this.storage.loadAll();
    return allConnections
      .filter((connection) => !connection.userFavorite)
      .sort(this.sortedAlphabetically)
      .map((connection) => ({
        ...connection,
        status: 'disconnected',
      }));
  }

  async saveConnection(
    info: ConnectionInfo
  ): Promise<StatusAwareConnectionInfo> {
    this.ensureWellFormedConnectionString(
      info.connectionOptions?.connectionString
    );

    await this.storage.save({ connectionInfo: info });
    return { ...info, status: 'disconnected' };
  }

  async deleteConnection(info: ConnectionInfo): Promise<void> {
    await this.storage.delete(info);
  }

  private ensureWellFormedConnectionString(connectionString: string) {
    new ConnectionString(connectionString);
  }

  private sortedAlphabetically = (
    a: StatusAwareConnectionInfo,
    b: StatusAwareConnectionInfo
  ) => {
    const aName = a.name?.toLocaleLowerCase() || '';
    const bName = b.name?.toLocaleLowerCase() || '';
    return bName < aName ? 1 : -1;
  };
}
