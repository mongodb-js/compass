import { ConnectionInfo } from '@mongodb-js/connection-info';
import { ConnectionStorage } from './connection-storage';
import ConnectionString from 'mongodb-connection-string-url';
import { merge } from 'lodash';

/**
 * Exposes an interface that will be implemented for each deployment environment to
 * get access to the connections on that environment. For Compass Desktop, it will
 * rely on the ConnectionStorage, for the Data Explorer, on the Atlas API (or another
 * facade on top of that).
 */
export interface ConnectionProvider {
  listConnections(): Promise<ConnectionInfo[]>;
  listConnectionHistory?(): Promise<ConnectionInfo[]>;
  saveConnection?(info: ConnectionInfo): Promise<ConnectionInfo>;
  deleteConnection?(info: ConnectionInfo): Promise<void>;
}

export class DesktopConnectionProvider implements ConnectionProvider {
  // Inject the type as it would be an instance (this is literally injecting the singleton)
  // in case we want to change how ConnectionStorage works in the future.
  constructor(private readonly storage: typeof ConnectionStorage) {}

  public static defaultInstance(): DesktopConnectionProvider {
    return new DesktopConnectionProvider(ConnectionStorage);
  }

  async listConnections(): Promise<ConnectionInfo[]> {
    const allConnections = await this.storage.loadAll();
    return allConnections
      .filter((connection) => connection.userFavorite)
      .sort(this.sortedAlphabetically);
  }

  async listConnectionHistory(): Promise<ConnectionInfo[]> {
    const allConnections = await this.storage.loadAll();
    return allConnections
      .filter((connection) => !connection.userFavorite)
      .sort(this.sortedAlphabetically);
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
    return { ...infoToSave, status: 'disconnected' };
  }

  async deleteConnection(info: ConnectionInfo): Promise<void> {
    await this.storage.delete(info);
  }

  private ensureWellFormedConnectionString(connectionString: string) {
    new ConnectionString(connectionString);
  }

  private sortedAlphabetically = (
    a: ConnectionInfo,
    b: ConnectionInfo
  ): 1 | -1 => {
    const aName = a.name?.toLocaleLowerCase() || '';
    const bName = b.name?.toLocaleLowerCase() || '';
    return bName < aName ? 1 : -1;
  };
}
