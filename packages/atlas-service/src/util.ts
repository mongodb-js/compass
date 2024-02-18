import type * as plugin from '@mongodb-js/oidc-plugin';
import type { AtlasUserConfig } from './user-config-store';
import type { PreferencesAccess } from 'compass-preferences-model';
import { defaultsDeep } from 'lodash';

export type AtlasUserInfo = {
  sub: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  login: string;
} & AtlasUserConfig;

export type IntrospectInfo = { active: boolean };

export type Token = plugin.IdPServerResponse;

// See: https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#errors
export class AtlasServiceError extends Error {
  statusCode: number;
  errorCode: string;
  detail: string;

  constructor(
    name: 'NetworkError' | 'ServerError',
    statusCode: number,
    detail: string,
    errorCode: string
  ) {
    super(`${errorCode}: ${detail}`);
    this.name = name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.detail = detail;
  }
}

export function throwIfNetworkTrafficDisabled(
  preferences: Pick<PreferencesAccess, 'getPreferences'>
) {
  if (!preferences.getPreferences().networkTraffic) {
    throw new Error('Network traffic is not allowed');
  }
}

/**
 * https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#errors
 */
export function isServerError(
  err: any
): err is { error: number; errorCode: string; detail: string } {
  return Boolean(err.error && err.errorCode && err.detail);
}

export async function throwIfNotOk(
  res: Pick<Response, 'ok' | 'status' | 'statusText' | 'json'>
) {
  if (res.ok) {
    return;
  }

  const messageJSON = await res.json().catch(() => undefined);
  if (messageJSON && isServerError(messageJSON)) {
    throw new AtlasServiceError(
      'ServerError',
      res.status,
      messageJSON.detail ?? 'Internal server error',
      messageJSON.errorCode ?? 'INTERNAL_SERVER_ERROR'
    );
  } else {
    throw new AtlasServiceError(
      'NetworkError',
      res.status,
      res.statusText,
      `${res.status}`
    );
  }
}

export type AtlasServiceConfig = {
  atlasApiBaseUrl: string;
  atlasApiUnauthBaseUrl: string;
  atlasLogin: {
    clientId: string;
    issuer: string;
  };
  authPortalUrl: string;
};

/**
 * Atlas service backend configurations.
 *  - compass-dev: locally running compass kanopy backend (localhost)
 *  - compass:    compass kanopy backend (compass.mongodb.com)
 *  - atlas-local: local mms backend (localhost)
 *  - atlas-dev:  dev mms backend (cloud-dev.mongodb.com)
 *  - atlas:      mms backend (cloud.mongodb.com)
 */
const config = {
  'compass-dev': {
    atlasApiBaseUrl: 'http://localhost:8080',
    atlasApiUnauthBaseUrl: 'http://localhost:8080',
    atlasLogin: {
      clientId: '0oajzdcznmE8GEyio297',
      issuer: 'https://auth.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account.mongodb.com/account/login',
  },
  compass: {
    atlasApiBaseUrl: 'https://compass.mongodb.com',
    atlasApiUnauthBaseUrl: 'https://compass.mongodb.com',
    atlasLogin: {
      clientId: '0oajzdcznmE8GEyio297',
      issuer: 'https://auth.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account.mongodb.com/account/login',
  },
  'atlas-local': {
    atlasApiBaseUrl: 'http://localhost:8080/api/private',
    atlasApiUnauthBaseUrl: 'http://localhost:8080/api/private/unauth',
    atlasLogin: {
      clientId: '0oaq1le5jlzxCuTbu357',
      issuer: 'https://auth-qa.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account-dev.mongodb.com/account/login',
  },
  'atlas-dev': {
    atlasApiBaseUrl: 'https://cloud-dev.mongodb.com/api/private',
    atlasApiUnauthBaseUrl: 'https://cloud-dev.mongodb.com/api/private/unauth',
    atlasLogin: {
      clientId: '0oaq1le5jlzxCuTbu357',
      issuer: 'https://auth-qa.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account-dev.mongodb.com/account/login',
  },
  atlas: {
    atlasApiBaseUrl: 'https://cloud.mongodb.com/api/private',
    atlasApiUnauthBaseUrl: 'https://cloud.mongodb.com/api/private/unauth',
    atlasLogin: {
      clientId: '0oajzdcznmE8GEyio297',
      issuer: 'https://auth.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account.mongodb.com/account/login',
  },
} as const;

export function getAtlasConfig(
  preferences: Pick<PreferencesAccess, 'getPreferences'>
) {
  const { atlasServiceBackendPreset } = preferences.getPreferences();
  const envConfig = {
    atlasApiBaseUrl: process.env.COMPASS_ATLAS_SERVICE_BASE_URL_OVERRIDE,
    atlasApiUnauthBaseUrl:
      process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE,
    atlasLogin: {
      clientId: process.env.COMPASS_CLIENT_ID_OVERRIDE,
      issuer: process.env.COMPASS_OIDC_ISSUER_OVERRIDE,
    },
    authPortalUrl: process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE,
  };
  return defaultsDeep(
    envConfig,
    config[atlasServiceBackendPreset]
  ) as typeof envConfig & typeof config[keyof typeof config];
}
