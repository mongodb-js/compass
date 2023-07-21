import type { AtlasService as AtlasServiceMain } from './main';
import { ipcInvoke } from './util';

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
  signIn = this.ipc.signIn;
}

export type { UserInfo, IntrospectInfo, Token } from './util';
