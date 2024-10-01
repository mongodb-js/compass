import type * as plugin from '@mongodb-js/oidc-plugin';
import type { PreferencesAccess } from 'compass-preferences-model';
import { defaultsDeep } from 'lodash';
import { createHash } from 'crypto';

export type AtlasUserInfo = {
  sub: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  login: string;
} & { enabledAIFeature: boolean };

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
function isAtlasAPIError(
  err: any
): err is { error: number; errorCode: string; detail: string } {
  return Boolean(err && err.error && err.errorCode && err.detail);
}

function isCloudBackendError(err: any): err is {
  errorCode: string;
  message: string;
  version: string;
  status: string;
} {
  return Boolean(
    err && err.errorCode && err.message && err.version && err.status
  );
}

export async function throwIfNotOk(
  res: Pick<Response, 'ok' | 'status' | 'statusText' | 'json'>
) {
  if (res.ok) {
    return;
  }

  const messageJSON = await res.json().catch(() => undefined);

  const status = res.status;
  let statusText = res.statusText;
  let errorCode = `${res.status}`;

  if (isAtlasAPIError(messageJSON)) {
    statusText = messageJSON.detail;
    errorCode = messageJSON.errorCode;
  }

  if (isCloudBackendError(messageJSON)) {
    statusText = messageJSON.message;
    errorCode = messageJSON.errorCode;
  }

  throw new AtlasServiceError('NetworkError', status, statusText, errorCode);
}

export type AtlasServiceConfig = {
  /**
   * MongoDB Driver WebSocket proxy base url
   */
  wsBaseUrl: string;
  /**
   * Cloud UI backend base url
   */
  cloudBaseUrl: string;
  /**
   * Atlas admin API base url
   */
  atlasApiBaseUrl: string;
  /**
   * Atlas OIDC config
   */
  atlasLogin: {
    clientId: string;
    issuer: string;
  };
  /**
   * Atlas Account Portal UI base url
   */
  authPortalUrl: string;
};

/**
 * Atlas service backend configurations.
 *  - atlas-local:             local mms backend         (localhost)
 *  - atlas-dev:               dev mms backend           (cloud-dev.mongodb.com)
 *  - atlas:                   mms backend               (cloud.mongodb.com)
 *  - web-sandbox-atlas-local: local mms backend + proxy (localhost / proxy prefix)
 *  - web-sandbox-atlas-dev:   dev mms backend + proxy   (cloud-dev.mongodb.com / proxy prefix)
 *  - web-sandbox-atlas:       mms backend + proxy       (cloud.mongodb.com / proxy prefix)
 */
const config = {
  'atlas-local': {
    wsBaseUrl: 'ws://localhost:61001/ws',
    cloudBaseUrl: '',
    atlasApiBaseUrl: 'http://localhost:8080/api/private',
    atlasLogin: {
      clientId: '0oaq1le5jlzxCuTbu357',
      issuer: 'https://auth-qa.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account-dev.mongodb.com/account/login',
  },
  'atlas-dev': {
    wsBaseUrl: '',
    cloudBaseUrl: '',
    atlasApiBaseUrl: 'https://cloud-dev.mongodb.com/api/private',
    atlasLogin: {
      clientId: '0oaq1le5jlzxCuTbu357',
      issuer: 'https://auth-qa.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account-dev.mongodb.com/account/login',
  },
  atlas: {
    wsBaseUrl: '',
    cloudBaseUrl: '',
    atlasApiBaseUrl: 'https://cloud.mongodb.com/api/private',
    atlasLogin: {
      clientId: '0oajzdcznmE8GEyio297',
      issuer: 'https://auth.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account.mongodb.com/account/login',
  },
  'web-sandbox-atlas-local': {
    wsBaseUrl: 'ws://localhost:1337',
    cloudBaseUrl: '/cloud-mongodb-com',
    atlasApiBaseUrl: 'http://localhost:8080/api/private',
    atlasLogin: {
      clientId: '0oaq1le5jlzxCuTbu357',
      issuer: 'https://auth-qa.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account-dev.mongodb.com/account/login',
  },
  'web-sandbox-atlas-dev': {
    wsBaseUrl: 'ws://localhost:1337',
    cloudBaseUrl: '/cloud-mongodb-com',
    atlasApiBaseUrl: 'https://cloud-dev.mongodb.com/api/private',
    atlasLogin: {
      clientId: '0oaq1le5jlzxCuTbu357',
      issuer: 'https://auth-qa.mongodb.com/oauth2/default',
    },
    authPortalUrl: 'https://account-dev.mongodb.com/account/login',
  },
  'web-sandbox-atlas': {
    wsBaseUrl: 'ws://localhost:1337',
    cloudBaseUrl: '/cloud-mongodb-com',
    atlasApiBaseUrl: 'https://cloud.mongodb.com/api/private',
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
    atlasApiBaseUrl: process.env.COMPASS_ATLAS_SERVICE_UNAUTH_BASE_URL_OVERRIDE,
    atlasLogin: {
      clientId: process.env.COMPASS_CLIENT_ID_OVERRIDE,
      issuer: process.env.COMPASS_OIDC_ISSUER_OVERRIDE,
    },
    authPortalUrl: process.env.COMPASS_ATLAS_AUTH_PORTAL_URL_OVERRIDE,
  };
  return defaultsDeep(
    envConfig,
    config[atlasServiceBackendPreset]
  ) as AtlasServiceConfig;
}

export function getTrackingUserInfo(userInfo: AtlasUserInfo) {
  return {
    // AUID is shared Cloud user identificator that can be tracked through
    // various MongoDB properties
    auid: createHash('sha256').update(userInfo.sub, 'utf8').digest('hex'),
  };
}
