import { ipcRenderer } from 'hadron-ipc';
import { EventEmitter } from 'events';

import type { ConnectionStorage as ConnectionStorageMain } from './connection-storage';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
export type {
  ConnectionInfo,
  AtlasClusterMetadata,
} from '@mongodb-js/connection-info';
import type { ImportConnectionOptions } from './import-export-connection';

export enum ConnectionStorageEvents {
  ConnectionsChanged = 'connections-changed',
}

export type ConnectionStorageEventListeners = {
  [ConnectionStorageEvents.ConnectionsChanged]: () => void;
};

export class ConnectionStorageBus extends EventEmitter {
  on<T extends ConnectionStorageEvents>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.on(eventName, listener);
  }

  off<T extends ConnectionStorageEvents>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.off(eventName, listener);
  }

  once<T extends ConnectionStorageEvents>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.once(eventName, listener);
  }

  removeListener<T extends ConnectionStorageEvents>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.removeListener(eventName, listener);
  }

  emit<T extends ConnectionStorageEvents>(
    eventName: T,
    ...args: Parameters<ConnectionStorageEventListeners[T]>
  ): boolean {
    return super.emit(eventName, ...args);
  }
}

export class ConnectionStorage {
  public static events: ConnectionStorageBus = new ConnectionStorageBus();

  private static _ipc = ipcRenderer?.createInvoke<
    typeof ConnectionStorageMain,
    | 'loadAll'
    | 'load'
    | 'getLegacyConnections'
    | 'save'
    | 'delete'
    | 'deserializeConnections'
    | 'importConnections'
    | 'exportConnections'
  >('ConnectionStorage', [
    'loadAll',
    'load',
    'getLegacyConnections',
    'save',
    'delete',
    'deserializeConnections',
    'importConnections',
    'exportConnections',
  ]);

  private static get ipc() {
    if (!this._ipc) {
      throw new Error('IPC not available');
    }
    return this._ipc;
  }

  static get loadAll() {
    return this.ipc.loadAll;
  }
  static get load() {
    return this.ipc.load;
  }
  static get getLegacyConnections() {
    return this.ipc.getLegacyConnections;
  }
  static async save({
    connectionInfo,
    signal,
  }: {
    signal?: AbortSignal;
    connectionInfo: ConnectionInfo;
  }): Promise<void> {
    await this.ipc.save({ connectionInfo, signal });
    this.events.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  static async delete({
    id,
    signal,
  }: {
    id: string;
    signal?: AbortSignal;
  }): Promise<void> {
    await this.ipc.delete({ id, signal });
    this.events.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  static get deserializeConnections() {
    return this.ipc.deserializeConnections;
  }
  static async importConnections({
    content,
    options = {},
    signal,
  }: {
    content: string;
    options?: ImportConnectionOptions;
    signal?: AbortSignal;
  }): Promise<void> {
    await this.ipc.importConnections({
      content,
      options,
      signal,
    });
    this.events.emit(ConnectionStorageEvents.ConnectionsChanged);
  }
  static get exportConnections() {
    return this.ipc.exportConnections;
  }
}
