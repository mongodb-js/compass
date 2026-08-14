import { ipcRenderer } from 'hadron-ipc';
import type { CompassAuthService as AtlasServiceMain } from './main';
import { AtlasAuthService } from './atlas-auth-service';
import type { ArgsWithSignal } from './atlas-auth-service';

export class CompassAtlasAuthService extends AtlasAuthService {
  private _ipc = ipcRenderer?.createInvoke<
    typeof AtlasServiceMain,
    'getUserInfo' | 'isAuthenticated' | 'signIn' | 'signOut'
  >('AtlasService', ['getUserInfo', 'isAuthenticated', 'signIn', 'signOut']);

  private get ipc() {
    if (!this._ipc) {
      throw new Error('IPC not available');
    }
    return this._ipc;
  }

  isAuthenticated(opts?: ArgsWithSignal) {
    return this.ipc.isAuthenticated(opts);
  }
  signOut() {
    return this.ipc.signOut();
  }
  signIn({ signal }: ArgsWithSignal = {}) {
    return this.ipc.signIn({ signal });
  }
  getUserInfo(opts?: ArgsWithSignal) {
    return this.ipc.getUserInfo(opts);
  }
}
