import { EventEmitter } from 'events';
import type { AtlasUserConfig } from './user-config-store';
import type { AtlasUserInfo } from './util';
import { ipcRenderer } from 'hadron-ipc';
import type { CompassAuthService as AtlasServiceMain } from './main';

type ArgsWithSignal<T = Record<string, unknown>> = T & { signal?: AbortSignal };
type SignInPrompt = 'none' | 'ai-promo-modal';

type AtlasAuthServiceEvents = {
  'signed-in': [];
  'signed-out': [];
  'token-refresh-failed': [];
  'user-config-changed': [AtlasUserConfig];
};

type AtlasAuthEventNames = keyof AtlasAuthServiceEvents;
type AtlasAuthEventListener<T extends AtlasAuthEventNames> = (
  ...args: AtlasAuthServiceEvents[T]
) => void;

export abstract class AtlasAuthService extends EventEmitter {
  abstract signIn(
    opts?: ArgsWithSignal<{ promptType?: SignInPrompt }>
  ): Promise<AtlasUserInfo>;
  abstract signOut(): Promise<void>;
  abstract isAuthenticated(opts?: ArgsWithSignal): Promise<boolean>;
  abstract getAuthHeaders(
    opts?: ArgsWithSignal
  ): Promise<Record<string, string>>;

  abstract getUserInfo(opts?: ArgsWithSignal): Promise<AtlasUserInfo>;
  abstract updateUserConfig(config: AtlasUserConfig): Promise<void>;

  on<T extends AtlasAuthEventNames>(
    evt: T,
    listener: AtlasAuthEventListener<T>
  ): this;
  on(evt: string, listener: (...args: any[]) => void): this {
    return super.on(evt, listener);
  }

  once<T extends AtlasAuthEventNames>(
    evt: T,
    listener: AtlasAuthEventListener<T>
  ): this;
  once(evt: string, listener: (...args: any[]) => void): this {
    return super.once(evt, listener);
  }

  off<T extends AtlasAuthEventNames>(
    evt: T,
    listener: AtlasAuthEventListener<T>
  ): this;
  off(evt: string, listener: (...args: any[]) => void): this {
    return super.off(evt, listener);
  }

  removeListener<T extends AtlasAuthEventNames>(
    evt: T,
    listener: AtlasAuthEventListener<T>
  ): this;
  removeListener(evt: string, listener: (...args: any[]) => void): this {
    return super.removeListener(evt, listener);
  }

  emit<T extends AtlasAuthEventNames>(
    evt: T,
    ...args: AtlasAuthServiceEvents[T]
  ): boolean;
  emit(evt: string, ...args: any[]): boolean {
    return super.emit(evt, ...args);
  }
}

export class CompassAtlasAuthService extends AtlasAuthService {
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

  async getAuthHeaders(opts: ArgsWithSignal = {}) {
    return {
      Authorization: `Bearer ${await this.ipc.maybeGetToken(opts)}`,
    };
  }

  isAuthenticated(opts?: ArgsWithSignal) {
    return this.ipc.isAuthenticated(opts);
  }
  signOut() {
    return this.ipc.signOut();
  }
  signIn(opts?: ArgsWithSignal<{ promptType?: SignInPrompt }>) {
    return this.ipc.signIn(opts);
  }
  getUserInfo(opts?: ArgsWithSignal) {
    return this.ipc.getUserInfo(opts);
  }
  updateUserConfig(config: AtlasUserConfig) {
    return this.ipc.updateAtlasUserConfig({ config });
  }
}
