import { EventEmitter } from 'events';
import { ipcRenderer } from 'hadron-ipc';
import type { AtlasService as AtlasServiceMain } from '../main';
import {
  disableAIFeature,
  enableAIFeature,
  signInWithModalPrompt,
  signInWithoutPrompt,
  signedOut,
  tokenRefreshFailed,
  userConfigChanged,
} from '../store/atlas-signin-reducer';
import { getStore } from '../store/atlas-signin-store';
import type { AtlasUserInfo, WithAbortSignal } from '../util';
import type { AtlasUserConfig } from '../user-config-store';

type AuthPromptType = 'none' | 'ai-promo-modal';

type AtlasAuthEvents = {
  'signed-in': [];
  'signed-out': [];
  'token-refresh-failed': [];
  'user-config-changed': [AtlasUserConfig];
};

export interface AtlasAuthClient {
  isAuthenticated(opts?: WithAbortSignal<{}>): Promise<boolean>;
  signIn: (opts: WithAbortSignal<{ promptType?: AuthPromptType }>) => Promise<AtlasUserInfo>;
  signOut: () => Promise<void>;
  updateAtlasUserConfig: (opts: WithAbortSignal<{config: AtlasUserConfig}>) => Promise<void>;
  getCurrentUser: (opts?: WithAbortSignal<{}>) => Promise<AtlasUserInfo>;
  // todo: find home
  enableAIFeature: () => Promise<void>;
  disableAIFeature: () => Promise<void>;
  on<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  once<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  off<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  removeListener<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  emit<T extends keyof AtlasAuthEvents>(
    evt: T,
    ...args: AtlasAuthEvents[T]
  ): boolean;
}

let compassAtlasAuthApiClientSingleton: CompassAtlasAuthApiClient;
export class CompassAtlasAuthApiClient implements AtlasAuthClient {
  private emitter = new EventEmitter();

  private _ipc = ipcRenderer?.createInvoke<
    typeof AtlasServiceMain,
    | 'signIn'
    | 'signOut'
    | 'updateAtlasUserConfig'
    | 'isAuthenticated'
    | 'getCurrentUser'
  >('AtlasService', [
    'signIn',
    'signOut',
    'updateAtlasUserConfig',
    'isAuthenticated',
    'getCurrentUser',
  ]);

  private get ipc() {
    if (!this._ipc) {
      throw new Error('IPC not available');
    }
    return this._ipc;
  }

  isAuthenticated({ signal }: { signal?: AbortSignal } = {}) {
    return this.ipc.isAuthenticated({ signal });
  }

  signOut() {
    return this.ipc.signOut();
  }
  updateAtlasUserConfig({ config }: { config: AtlasUserConfig }) {
    return this.ipc.updateAtlasUserConfig({ config });
  }

  getCurrentUser({ signal }: { signal?: AbortSignal } = {}) {
    return this.ipc.getCurrentUser({ signal });
  }

  on<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  on(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.on(evt, listener);
    return this;
  }

  once<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  once(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.once(evt, listener);
    return this;
  }

  off<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  off(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.off(evt, listener);
    return this;
  }
  removeListener<T extends keyof AtlasAuthEvents>(
    evt: T,
    listener: (...args: AtlasAuthEvents[T]) => void
  ): this;
  removeListener(evt: string, listener: (...args: any[]) => void): this {
    this.emitter.off(evt, listener);
    return this;
  }

  emit<T extends keyof AtlasAuthEvents>(
    evt: T,
    ...args: AtlasAuthEvents[T]
  ): boolean;
  emit(evt: string, ...args: any[]): boolean {
    return this.emitter.emit(evt, ...args);
  }

  async signIn({
    promptType,
    signal,
  }: {
    signal?: AbortSignal;
    promptType?: AuthPromptType;
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

  // todo: find home
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
    if (compassAtlasAuthApiClientSingleton) {
      return compassAtlasAuthApiClientSingleton;
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
    compassAtlasAuthApiClientSingleton = this;
  }
}
