import { ipcRenderer } from 'hadron-ipc';
import type { AtlasService as AtlasServiceMain } from './main';
import type { AtlasUserInfo } from './util';
import { getStore } from './store/atlas-signin-store';
import {
  signInWithModalPrompt,
  signInWithoutPrompt,
} from './store/atlas-signin-reducer';

export class CompassOidcIpcClient {
  private _ipc = ipcRenderer?.createInvoke<
    typeof AtlasServiceMain,
    | 'getUserInfo'
    | 'isAuthenticated'
    | 'signIn'
    | 'signOut'
    | 'updateAtlasUserConfig'
    | 'maybeGetToken'
  >('AtlasService', [
    'getUserInfo',
    'isAuthenticated',
    'signIn',
    'signOut',
    'updateAtlasUserConfig',
    'maybeGetToken',
  ]);

  private get ipc() {
    if (!this._ipc) {
      throw new Error('IPC not available');
    }
    return this._ipc;
  }

  getToken(options: { signal?: AbortSignal } = {}) {
    return this.ipc.maybeGetToken(options);
  }

  get getUserInfo() {
    return this.ipc.getUserInfo;
  }
  get isAuthenticated() {
    return this.ipc.isAuthenticated;
  }
  get signOut() {
    return this.ipc.signOut;
  }
  get updateAtlasUserConfig() {
    return this.ipc.updateAtlasUserConfig;
  }

  async signIn({
    promptType,
    signal,
  }: {
    signal?: AbortSignal;
    promptType?: 'none' | 'ai-promo-modal';
  } = {}): Promise<AtlasUserInfo> {
    switch (promptType) {
      case 'none':
        return getStore().dispatch(signInWithoutPrompt({ signal }));
      case 'ai-promo-modal':
        return getStore().dispatch(signInWithModalPrompt({ signal }));
      default:
        return this.ipc.signIn({ signal });
    }
  }

  private static instance: CompassOidcIpcClient;
  private constructor() {
    // private constructor
  }
  static getInstance() {
    if (!this.instance) {
      this.instance = new CompassOidcIpcClient();
    }
    return this.instance;
  }
}

export { AtlasSignIn } from './components/atlas-signin';

export { AtlasServiceError, getAtlasConfig } from './util';
export type { AtlasUserConfig } from './user-config-store';
export type { AtlasUserInfo, IntrospectInfo, Token } from './util';
export { AtlasService } from './atlas-service';
export { AtlasHttpApiClient } from './atlas-http-api-client';
export {
  CompassAtlasAuthService,
  AtlasAuthService,
} from './atlas-auth-service';
