import { EventEmitter } from 'events';
import { ipcRenderer } from 'electron';
import { ipcInvoke } from '@mongodb-js/compass-utils';
import type { AtlasService as AtlasServiceMain } from './main';
import {
  signInWithModalPrompt,
  signInWithoutPrompt,
  signedOut,
  tokenRefreshFailed,
} from './store/atlas-signin-reducer';
import { dispatch } from './store/atlas-signin-store';

let atlasServiceInstanceSingleton: AtlasService;

type AtlasServiceEvents = 'signed-in' | 'signed-out' | 'token-refresh-failed';

interface AtlasServiceEmitter {
  emit(evt: AtlasServiceEvents): boolean;
  on(evt: AtlasServiceEvents, listener: () => void): this;
  once(evt: AtlasServiceEvents, listener: () => void): this;
  off(evt: AtlasServiceEvents, listener: () => void): this;
}

export class AtlasService implements AtlasServiceEmitter {
  private emitter = new EventEmitter();

  private ipc = ipcInvoke<
    typeof AtlasServiceMain,
    | 'getUserInfo'
    | 'introspect'
    | 'isAuthenticated'
    | 'signIn'
    | 'signOut'
    | 'getAggregationFromUserInput'
    | 'getQueryFromUserInput'
  >('AtlasService', [
    'getUserInfo',
    'introspect',
    'isAuthenticated',
    'signIn',
    'signOut',
    'getAggregationFromUserInput',
    'getQueryFromUserInput',
  ]);

  getUserInfo = this.ipc.getUserInfo;
  introspect = this.ipc.introspect;
  isAuthenticated = this.ipc.isAuthenticated;
  getAggregationFromUserInput = this.ipc.getAggregationFromUserInput;
  getQueryFromUserInput = this.ipc.getQueryFromUserInput;
  signOut = this.ipc.signOut;

  on(evt: AtlasServiceEvents, listener: () => void) {
    this.emitter.on(evt, listener);
    return this;
  }

  once(evt: AtlasServiceEvents, listener: () => void) {
    this.emitter.once(evt, listener);
    return this;
  }

  off(evt: AtlasServiceEvents, listener: () => void) {
    this.emitter.off(evt, listener);
    return this;
  }

  emit(evt: AtlasServiceEvents) {
    return this.emitter.emit(evt);
  }

  async signIn({
    promptType,
    signal,
  }: {
    signal?: AbortSignal;
    promptType?: 'none' | 'ai-promo-modal';
  } = {}) {
    switch (promptType) {
      case 'none':
        await dispatch(signInWithoutPrompt({ signal }));
        return;
      case 'ai-promo-modal':
        await dispatch(signInWithModalPrompt({ signal }));
        return;
      default:
        await this.ipc.signIn({ signal });
        return;
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

    ipcRenderer?.on('atlas-service-signed-out', () => {
      dispatch(signedOut());
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    atlasServiceInstanceSingleton = this;
  }
}

export { AtlasSignIn } from './components/atlas-signin';

export type {
  UserInfo,
  IntrospectInfo,
  Token,
  AtlasServiceNetworkError,
  AIQuery,
  AIAggregation,
} from './util';
