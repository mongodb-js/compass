import { getAppName, getAppVersion } from '@mongodb-js/compass-utils';
import { throwIfNetworkTrafficDisabled } from './util';
import { AtlasServiceConfig } from './util';
import { PreferencesAccess } from 'compass-preferences-model';
import { defaultsDeep } from 'lodash';
import { AtlasAuthService as AtlasAuthServiceRenderer } from './renderer';

export class AtlasHttpApiClient {
  private config: AtlasServiceConfig;
  private atlasLoginServiceRenderer: AtlasAuthServiceRenderer;
  constructor(private preferences: Pick<PreferencesAccess, 'getPreferences'>) {
    this.config = this.getConfig();
    this.atlasLoginServiceRenderer = new AtlasAuthServiceRenderer();
  }
  private getConfig() {
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
        atlasApiUnauthBaseUrl:
          'https://cloud-dev.mongodb.com/api/private/unauth',
        atlasLogin: {
          clientId: '0oaq1le5jlzxCuTbu357',
          issuer: 'https://auth-qa.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account-dev.mongodb.com/account/login',
      },
      atlas: {
        atlasApiBaseUrl: 'https://cloud.mongodb.com/api/private',
        atlasApiUnauthBaseUrl: 'https://cloud.mongodb.com/api/private/unauth',
        // todo: clean up
        // atlasApiBaseUrl: 'http://localhost:9000/api/private',
        // atlasApiUnauthBaseUrl: 'http://localhost:9000/api/private/unauth',
        atlasLogin: {
          clientId: '0oajzdcznmE8GEyio297',
          issuer: 'https://auth.mongodb.com/oauth2/default',
        },
        authPortalUrl: 'https://account.mongodb.com/account/login',
      },
    } as const;

    const { atlasServiceBackendPreset } = this.preferences.getPreferences();

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
  privateUnAuthEndpoint(path: string): string {
    return `${this.config.atlasApiUnauthBaseUrl}/${path}`;
  }
  privateAtlasEndpoint(path: string): string {
    return `${this.config.atlasApiBaseUrl}/${path}`;
  }
  unAuthenticatedFetch = async (
    url: RequestInfo,
    init: RequestInit = {}
  ): Promise<Response> => {
    throwIfNetworkTrafficDisabled(this.preferences);
    return await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        'User-Agent': `${getAppName()}/${getAppVersion()}`,
      },
    });
  };
  async fetch(url: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const token = await this.atlasLoginServiceRenderer
      .getToken({
        signal: init.signal as AbortSignal,
      })
      .catch(() => null);
    return await this.unAuthenticatedFetch(url, {
      ...init,
      headers: {
        ...init.headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  }
}
