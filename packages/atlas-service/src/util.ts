import type * as plugin from '@mongodb-js/oidc-plugin';
import type { AtlasUserConfig } from './user-config-store';
import { PreferencesAccess } from 'compass-preferences-model';

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
