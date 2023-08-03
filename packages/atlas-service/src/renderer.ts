import type { AtlasService as AtlasServiceMain } from './main';
import { ipcInvoke } from './util';
import {
  signInWithModalPrompt,
  tokenRefreshFailed,
} from './store/atlas-signin-reducer';
import { dispatch } from './store/atlas-signin-store';
import { ipcRenderer } from 'electron';

let atlasServiceInstanceSingleton: AtlasService;

export class AtlasService {
  private ipc = ipcInvoke<
    typeof AtlasServiceMain,
    | 'getUserInfo'
    | 'introspect'
    | 'isAuthenticated'
    | 'signIn'
    | 'getQueryFromUserPrompt'
  >('AtlasService', [
    'getUserInfo',
    'introspect',
    'isAuthenticated',
    'signIn',
    'getQueryFromUserPrompt',
  ]);

  getUserInfo = this.ipc.getUserInfo;
  introspect = this.ipc.introspect;
  isAuthenticated = this.ipc.isAuthenticated;
  getQueryFromUserPrompt = this.ipc.getQueryFromUserPrompt;

  async signIn(
    options: {
      signal?: AbortSignal;
      promptType?: 'none' | 'ai-promo-modal';
    } = {}
  ) {
    switch (options.promptType ?? 'none') {
      case 'none':
        await this.ipc.signIn({ signal: options.signal });
        return;
      case 'ai-promo-modal':
        await dispatch(signInWithModalPrompt({ signal: options.signal }));
        return;
      default:
        return Promise.reject(new Error('Not implemented'));
    }
  }

  constructor() {
    if (atlasServiceInstanceSingleton) {
      return atlasServiceInstanceSingleton;
    }

    // We might not be in electorn environment
    ipcRenderer?.on('atlas-service-token-refresh-failed', () => {
      dispatch(tokenRefreshFailed());
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    atlasServiceInstanceSingleton = this;
  }
}

export { AtlasSignIn } from './components/atlas-signin';

export type { UserInfo, IntrospectInfo, Token } from './util';
