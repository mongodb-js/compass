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
import type { ConnectionGroup } from './connection-group';

export type ConnectionStorageIPCInterface = Required<
  Omit<ConnectionStorage, 'on' | 'off' | 'emit'>
>;

export type ConnectionStorageIPCRenderer = Pick<
  HadronIpcRenderer,
  'createInvoke' | 'call'
>;

class CompassRendererConnectionStorage implements ConnectionStorage {
  private _ipc: ConnectionStorageIPCInterface | undefined;
  private readonly ipcRenderer?: ConnectionStorageIPCRenderer;
  constructor(ipcRenderer?: ConnectionStorageIPCRenderer) {
    this.ipcRenderer = ipcRenderer;
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
        | 'loadGroups'
        | 'saveGroup'
        | 'deleteGroup'
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
        'loadGroups',
        'saveGroup',
        'deleteGroup',
      ]));
    if (!ipc) {
      throw new Error('IPC not available');
    }
    return ipc;
  }

  loadAll(options?: {
    signal?: AbortSignal | undefined;
  }): Promise<ConnectionInfo[]> {
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

  getLegacyConnections(options?: {
    signal?: AbortSignal | undefined;
  }): Promise<{ name: string }[]> {
    return this.ipc.getLegacyConnections(options);
  }

  deserializeConnections(args: {
    content: string;
    options: ImportConnectionOptions;
    signal?: AbortSignal | undefined;
  }): Promise<ConnectionInfo[]> {
    return this.ipc.deserializeConnections(args);
  }

  exportConnections(args?: {
    options?: ExportConnectionOptions | undefined;
    signal?: AbortSignal | undefined;
  }): Promise<string> {
    return this.ipc.exportConnections(args);
  }

  async importConnections(args: {
    content: string;
    options?: ImportConnectionOptions | undefined;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.importConnections(args);
  }

  loadGroups(options?: {
    signal?: AbortSignal | undefined;
  }): Promise<ConnectionGroup[]> {
    return this.ipc.loadGroups(options);
  }

  async saveGroup(options: {
    group: ConnectionGroup;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.saveGroup(options);
  }

  async deleteGroup(options: {
    id: string;
    signal?: AbortSignal | undefined;
  }): Promise<void> {
    await this.ipc.deleteGroup(options);
  }
}

export { CompassRendererConnectionStorage };
