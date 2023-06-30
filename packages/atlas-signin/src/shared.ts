import type * as plugin from '@mongodb-js/oidc-plugin';

export type UserInfo = unknown;

export type IntrospectInfo = { active: boolean };

export type Token = plugin.IdPServerResponse;

export const enum Events {
  IsAuthenticated = 'atlas-is-authenticated',
  SignIn = 'atlas-signin',
  UserInfo = 'atlas-userinfo',
}
