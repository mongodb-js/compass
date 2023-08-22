import { ipcInvoke } from '@mongodb-js/compass-utils';

import type { ConnectionStorage as ConnectionStorageMain } from './connection-storage';
export { ConnectionInfo, ConnectionFavoriteOptions } from './connection-info';
export { getConnectionTitle } from './connection-title';

export class ConnectionStorage {
  private static ipc = ipcInvoke<
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

  static loadAll = this.ipc.loadAll;
  static load = this.ipc.load;
  static getLegacyConnections = this.ipc.getLegacyConnections;
  static save = this.ipc.save;
  static delete = this.ipc.delete;
  static deserializeConnections = this.ipc.deserializeConnections;
  static importConnections = this.ipc.importConnections;
  static exportConnections = this.ipc.exportConnections;
}
