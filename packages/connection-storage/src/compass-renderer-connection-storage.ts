import { EventEmitter } from 'events';
import {
  type ConnectionStorageIPCRenderer,
  type ConnectionStorageEvent,
  type ConnectionStorageEventListeners,
  type ConnectionStorageIPCInterface,
  type ConnectionStorage,
  type AutoConnectPreferences,
  ConnectionStorageEvents,
} from './connection-storage';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  ExportConnectionOptions,
  ImportConnectionOptions,
} from './import-export-connection';

class CompassRendererConnectionStorage
  extends EventEmitter
  implements ConnectionStorage
{
  private _ipc: ConnectionStorageIPCInterface | undefined;
  constructor(
    private readonly ipcRenderer?: ConnectionStorageIPCRenderer,
    private readonly getInitialAutoConnectPreferences?: () => Promise<AutoConnectPreferences>
  ) {
    super();
  }

  get ipc() {
    const ipc =
      this._ipc ??
      (this._ipc = this.ipcRenderer?.createInvoke<
        ConnectionStorageIPCInterface,
        | 'loadAll'
        | 'load'
        | 'save'
        | 'delete'
        | 'getAutoConnectInfo'
        | 'getLegacyConnections'
        | 'deserializeConnections'
        | 'exportConnections'
        | 'importConnections'
      >('ConnectionStorage', [
        'loadAll',
        'load',
        'save',
        'delete',
        'getAutoConnectInfo',
        'getLegacyConnections',
        'deserializeConnections',
        'exportConnections',
        'importConnections',
      ]));
    if (!ipc) {
      throw new Error('IPC not available');
    }
    return ipc;
  }

  loadAll(
    options?: { signal?: AbortSignal | undefined } | undefined
  ): Promise<ConnectionInfo[]> {
    return this.ipc.loadAll(options);
  }

  load(options: {
    id: string;
    signal?: AbortSignal | undefined;
  }): Promise<ConnectionInfo | undefined> {
    return this.ipc.load(options);
  }

  async save(options: {
    connectionInfo: ConnectionInfo;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.save(options);
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  async delete(options: {
    id: string;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.delete(options);
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  async getAutoConnectInfo(
    autoConnectPreferences?: AutoConnectPreferences
  ): Promise<ConnectionInfo | undefined> {
    return await this.ipc.getAutoConnectInfo(
      autoConnectPreferences ??
        (await this.getInitialAutoConnectPreferences?.()) ?? {
          shouldAutoConnect: false,
        }
    );
  }

  getLegacyConnections(
    options?: { signal?: AbortSignal | undefined } | undefined
  ): Promise<{ name: string }[]> {
    return this.ipc.getLegacyConnections(options);
  }

  deserializeConnections(args: {
    content: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal | undefined;
  }): Promise<ConnectionInfo[]> {
    return this.ipc.deserializeConnections(args);
  }

  exportConnections(
    args?:
      | {
          options?: ExportConnectionOptions | undefined;
          signal?: AbortSignal | undefined;
        }
      | undefined
  ): Promise<string> {
    return this.ipc.exportConnections(args);
  }

  async importConnections(args: {
    content: string;
    options?: ImportConnectionOptions | undefined;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.importConnections(args);
    this.emit(ConnectionStorageEvents.ConnectionsChanged);
  }

  on<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.on(eventName, listener);
  }

  off<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.off(eventName, listener);
  }

  once<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.once(eventName, listener);
  }

  removeListener<T extends ConnectionStorageEvent>(
    eventName: T,
    listener: ConnectionStorageEventListeners[T]
  ): this {
    return super.removeListener(eventName, listener);
  }

  emit<T extends ConnectionStorageEvent>(
    eventName: T,
    ...args: Parameters<ConnectionStorageEventListeners[T]>
  ): boolean {
    return super.emit(eventName, ...args);
  }
}

export { CompassRendererConnectionStorage };
