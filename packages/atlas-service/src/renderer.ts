import type { AtlasService as AtlasServiceMain } from './main';
import { ipcInvoke } from './util';

export function AtlasService() {
  return ipcInvoke<
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
}
