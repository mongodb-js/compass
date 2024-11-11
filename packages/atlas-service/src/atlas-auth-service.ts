import { EventEmitter } from 'events';
import type { AtlasUserInfo } from './util';

export type ArgsWithSignal<T = Record<string, unknown>> = T & {
  signal?: AbortSignal;
};
export type SignInPrompt = 'none';

type AtlasAuthServiceEvents = {
  'signed-in': [];
  'signed-out': [];
  'token-refresh-failed': [];
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
