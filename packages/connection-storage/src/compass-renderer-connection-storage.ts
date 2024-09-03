import type { HadronIpcRenderer } from 'hadron-ipc';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type {
  AutoConnectPreferences,
  ConnectionStorage,
} from './connection-storage';
import type {
  ExportConnectionOptions,
  ImportConnectionOptions,
} from './import-export-connection';

export type ConnectionStorageIPCInterface = Required<
  Omit<ConnectionStorage, 'on' | 'off' | 'emit'>
>;

export type ConnectionStorageIPCRenderer = Pick<
  HadronIpcRenderer,
  'createInvoke' | 'call'
>;

class CompassRendererConnectionStorage implements ConnectionStorage {
  private _ipc: ConnectionStorageIPCInterface | undefined;
  constructor(private readonly ipcRenderer?: ConnectionStorageIPCRenderer) {}

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
  }

  async delete(options: {
    id: string;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.delete(options);
  }

  async getAutoConnectInfo(
    autoConnectPreferences: AutoConnectPreferences
  ): Promise<ConnectionInfo | undefined> {
    return await this.ipc.getAutoConnectInfo(autoConnectPreferences);
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
  }
}

export { CompassRendererConnectionStorage };
