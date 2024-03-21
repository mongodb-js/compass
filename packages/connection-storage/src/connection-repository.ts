import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { type ConnectionStorage } from './renderer';
import ConnectionString from 'mongodb-connection-string-url';
import { merge } from 'lodash';

type ConnectionStorageFacade = Pick<
  typeof ConnectionStorage,
  'loadAll' | 'load' | 'save' | 'delete'
>;

type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type PartialConnectionInfo = DeepPartial<ConnectionInfo> &
  Pick<ConnectionInfo, 'id'>;

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

  async saveConnection(info: PartialConnectionInfo): Promise<ConnectionInfo> {
    const oldConnectionInfo = await this.storage.load({ id: info.id });
    const infoToSave = (
      oldConnectionInfo ? merge(oldConnectionInfo, info) : info
    ) as ConnectionInfo;

    this.ensureWellFormedConnectionString(
      infoToSave.connectionOptions?.connectionString
    );

    await this.storage.save({ connectionInfo: infoToSave });
    return infoToSave;
  }

  async updateLastUsage(infoId: ConnectionInfo['id']): Promise<void> {
    const connectionInfo = await this.storage.load({ id: infoId });
    if (!connectionInfo) {
      return;
    }

    connectionInfo.lastUsed = new Date();
    await this.storage.save({ connectionInfo });
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
