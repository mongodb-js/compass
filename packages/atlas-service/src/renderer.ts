import { EventEmitter } from 'events';
import { ipcRenderer } from 'electron';
import { ipcInvoke } from '@mongodb-js/compass-utils';
import type { AtlasService as AtlasServiceMain } from './main';
import {
  disableAIFeature,
  enableAIFeature,
  signInWithModalPrompt,
  signInWithoutPrompt,
  signedOut,
  tokenRefreshFailed,
  userConfigChanged,
} from './store/atlas-signin-reducer';
import { getStore } from './store/atlas-signin-store';
import type { AtlasUserConfig, AtlasUserInfo } from './util';

let atlasServiceInstanceSingleton: AtlasService;

type AtlasServiceEvents = {
  'signed-in': [];
  'signed-out': [];
  'token-refresh-failed': [];
  'user-config-changed': [AtlasUserConfig];
};

export class AtlasService {
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
    | 'updateAtlasUserConfig'
  >('AtlasService', [
    'getUserInfo',
    'introspect',
    'isAuthenticated',
    'signIn',
    'signOut',
    'getAggregationFromUserInput',
    'getQueryFromUserInput',
    'updateAtlasUserConfig',
  ]);

  getUserInfo = this.ipc.getUserInfo;
  introspect = this.ipc.introspect;
  isAuthenticated = this.ipc.isAuthenticated;
  getAggregationFromUserInput = this.ipc.getAggregationFromUserInput;
  getQueryFromUserInput = this.ipc.getQueryFromUserInput;
  signOut = this.ipc.signOut;
  updateAtlasUserConfig = this.ipc.updateAtlasUserConfig;

  on<T extends keyof AtlasServiceEvents>(
    evt: T,
    listener: (...args: AtlasServiceEvents[T]) => void
  ): this;
  on(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.on(evt, listener);
    return this;
  }

  once<T extends keyof AtlasServiceEvents>(
    evt: T,
    listener: (...args: AtlasServiceEvents[T]) => void
  ): this;
  once(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.once(evt, listener);
    return this;
  }

  off<T extends keyof AtlasServiceEvents>(
    evt: T,
    listener: (...args: AtlasServiceEvents[T]) => void
  ): this;
  off(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.off(evt, listener);
    return this;
  }

  emit<T extends keyof AtlasServiceEvents>(
    evt: T,
    ...args: AtlasServiceEvents[T]
  ): boolean;
  emit(evt: string, ...args: any[]): boolean {
    return this.emitter.emit(evt, ...args);
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

  async enableAIFeature() {
    const accepted = await getStore().dispatch(enableAIFeature());
    if (!accepted) {
      throw new Error('Terms and conditions were not accepted');
    }
  }

  async disableAIFeature() {
    await getStore().dispatch(disableAIFeature());
  }

  constructor() {
    if (atlasServiceInstanceSingleton) {
      return atlasServiceInstanceSingleton;
    }

    // We might not be in electorn environment
    ipcRenderer?.on('atlas-service-token-refresh-failed', () => {
      getStore().dispatch(tokenRefreshFailed());
    });

    ipcRenderer?.on('atlas-service-signed-out', () => {
      getStore().dispatch(signedOut());
    });

    ipcRenderer?.on(
      'atlas-service-user-config-changed',
      (_evt, newConfig: AtlasUserConfig) => {
        getStore().dispatch(userConfigChanged(newConfig));
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    atlasServiceInstanceSingleton = this;
  }
}

export { AtlasSignIn } from './components/atlas-signin';

export type {
  AtlasUserInfo,
  AtlasUserConfig,
  IntrospectInfo,
  Token,
  AtlasServiceError,
  AIQuery,
  AIAggregation,
} from './util';
