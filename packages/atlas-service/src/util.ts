import type * as plugin from '@mongodb-js/oidc-plugin';

export type UserInfo = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  login: string;
};

export type IntrospectInfo = { active: boolean };

export type Token = plugin.IdPServerResponse;

export type AIAggregation = {
  content?: {
    aggregation?: unknown;
  };
};

export type AIQuery = {
  content?: {
    query?: unknown;
  };
};
