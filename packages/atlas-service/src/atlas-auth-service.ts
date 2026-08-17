import { EventEmitter } from 'events';
import type { AtlasUserInfo } from './util';

export type ArgsWithSignal<T = Record<string, unknown>> = T & {
  signal?: AbortSignal;
};

export abstract class AtlasAuthService extends EventEmitter {
  abstract signIn(opts?: ArgsWithSignal): Promise<AtlasUserInfo>;
  abstract signOut(): Promise<void>;
  abstract isAuthenticated(opts?: ArgsWithSignal): Promise<boolean>;

  abstract getUserInfo(opts?: ArgsWithSignal): Promise<AtlasUserInfo>;
}
