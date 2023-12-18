import { ipcRenderer } from 'hadron-ipc';

import type { ConnectionStorage as ConnectionStorageMain } from './connection-storage';
export type {
  ConnectionInfo,
  ConnectionFavoriteOptions,
} from './connection-info';
export { getConnectionTitle } from './connection-title';

export class ConnectionStorage {
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
  static get save() {
    return this.ipc.save;
  }
  static get delete() {
    return this.ipc.delete;
  }
  static get deserializeConnections() {
    return this.ipc.deserializeConnections;
  }
  static get importConnections() {
    return this.ipc.importConnections;
  }
  static get exportConnections() {
    return this.ipc.exportConnections;
  }
}
