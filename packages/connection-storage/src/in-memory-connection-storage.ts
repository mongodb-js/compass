import { type ConnectionInfo } from '@mongodb-js/connection-info';
import { type ConnectionStorage } from './connection-storage';

export class InMemoryConnectionStorage implements ConnectionStorage {
  private connections: ConnectionInfo[];
  constructor(connections: ConnectionInfo[] = []) {
    this.connections = [...connections];
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
    return Promise.resolve();
  }

  delete({ id }: { id: string }): Promise<void> {
    const existingConnectionIdx = this.connections.findIndex(
      (connection) => connection.id === id
    );
    if (existingConnectionIdx !== -1) {
      this.connections.splice(existingConnectionIdx, 1);
    }
    return Promise.resolve();
  }

  getLegacyConnections(): Promise<{ name: string }[]> {
    return Promise.resolve([]);
  }

  importConnections(): Promise<void> {
    return Promise.resolve();
  }

  exportConnections(): Promise<string> {
    return Promise.resolve('');
  }

  deserializeConnections() {
    return Promise.resolve([]);
  }
}
