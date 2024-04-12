import { EventEmitter } from 'events';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import {
  ConnectionStorageEvents,
  type ConnectionStorage,
} from './connection-storage';
import {
  type ExportConnectionOptions,
  type ImportConnectionOptions,
  serializeConnections,
  deserializeConnections,
} from './import-export-connection';

export class InMemoryConnectionStorage
  extends EventEmitter
  implements ConnectionStorage
{
  private connections: ConnectionInfo[];
  private legacyConnections: { name: string }[];
  constructor(
    connections: ConnectionInfo[] = [],
    legacyConnections: { name: string }[] = []
  ) {
    super();
    this.connections = [...connections];
    this.legacyConnections = [...legacyConnections];
  }

  static async createAsync(
    retrieveConnections?: () => Promise<ConnectionInfo[]>
  ) {
    const connections = (await retrieveConnections?.()) ?? [];
    return new InMemoryConnectionStorage(connections);
  }

  loadAll(): Promise<ConnectionInfo[]> {
    return Promise.resolve(this.connections);
  }

  load({ id }: { id: string }): Promise<ConnectionInfo | undefined> {
    return Promise.resolve(
      this.connections.find((connection) => connection.id === id)
    );
  }

  private _save({ connectionInfo }: { connectionInfo: ConnectionInfo }) {
    const existingConnectionIdx = this.connections.findIndex(
      (connection) => connection.id === connectionInfo.id
    );
    if (existingConnectionIdx !== -1) {
      const existingConnection = this.connections[existingConnectionIdx];
      this.connections.splice(existingConnectionIdx, 1, {
        ...existingConnection,
        ...connectionInfo,
      });
    } else {
      this.connections.push(connectionInfo);
    }
  }

  save({ connectionInfo }: { connectionInfo: ConnectionInfo }): Promise<void> {
    this._save({ connectionInfo });
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
    return Promise.resolve();
  }

  delete({ id }: { id: string }): Promise<void> {
    const existingConnectionIdx = this.connections.findIndex(
      (connection) => connection.id === id
    );
    if (existingConnectionIdx !== -1) {
      this.connections.splice(existingConnectionIdx, 1);
    }
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
    return Promise.resolve();
  }

  getLegacyConnections(): Promise<{ name: string }[]> {
    return Promise.resolve(this.legacyConnections);
  }

  async deserializeConnections({
    content,
    options = {},
  }: {
    content: string;
    options: ImportConnectionOptions;
  }): Promise<ConnectionInfo[]> {
    const { passphrase, trackingProps, filterConnectionIds } = options;
    const connections = await deserializeConnections(content, {
      passphrase,
      trackingProps,
    });
    return filterConnectionIds
      ? connections.filter((x) => filterConnectionIds.includes(x.id))
      : connections;
  }

  async exportConnections({
    options = {},
  }: {
    options?: ExportConnectionOptions;
  } = {}): Promise<string> {
    const { filterConnectionIds, ...restOfOptions } = options;
    const connections = await this.loadAll();
    const exportConnections = filterConnectionIds
      ? connections.filter((x) => filterConnectionIds.includes(x.id))
      : connections.filter((x) => x.favorite?.name);

    return serializeConnections(exportConnections, restOfOptions);
  }

  async importConnections({
    content,
    options = {},
  }: {
    content: string;
    options?: ImportConnectionOptions;
  }): Promise<void> {
    const connections = await this.deserializeConnections({
      content,
      options,
    });

    await Promise.all(
      connections.map((connectionInfo) => this._save({ connectionInfo }))
    );
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }
}
