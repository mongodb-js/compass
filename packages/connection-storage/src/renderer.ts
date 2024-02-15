import { ipcRenderer } from 'hadron-ipc';
import { createContext } from 'react';

import type { ConnectionStorage as ConnectionStorageMain } from './connection-storage';
export type { ConnectionInfo } from '@mongodb-js/connection-info';

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

export const ConnectionStorageContext = createContext<
  typeof ConnectionStorage | null
>(null);
