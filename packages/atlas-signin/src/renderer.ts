import { ipcRenderer } from 'electron';
import type { Token, UserInfo } from './shared';
import { Events } from './shared';

export class AtlasSignIn {
  private constructor() {
    // singleton
  }
  static isAuthenticated(): Promise<boolean> {
    return ipcRenderer.invoke(Events.IsAuthenticated);
  }
  static signIn(): Promise<Token> {
    return ipcRenderer.invoke(Events.SignIn);
  }
  static userInfo(): Promise<UserInfo> {
    return ipcRenderer.invoke(Events.UserInfo);
  }
}
