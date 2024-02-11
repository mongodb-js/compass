import {
  throwIfAborted,
  getAppName,
  getAppVersion,
} from '@mongodb-js/compass-utils';
import type { AtlasUserInfo } from './util';
import { throwIfNetworkTrafficDisabled, throwIfNotOk } from './util';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { AtlasServiceConfig } from './util';
import { PreferencesAccess } from 'compass-preferences-model';
import { defaultsDeep } from 'lodash';
import { AtlasLoginService as AtlasLoginServiceRenderer } from './renderer';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-ATLAS-SERVICE');

export interface AtlasHttpApiClient {
  getCurrentUser(): Promise<AtlasUserInfo>;
  privateUnAuthEndpoint(path: string): string;
  privateAtlasEndpoint(path: string): string;
  fetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
  unAuthenticatedFetch(url: RequestInfo, init?: RequestInit): Promise<Response>;
}

export class CompassAtlasHttpApiClient implements AtlasHttpApiClient {
  private config: AtlasServiceConfig;
  private atlasLoginServiceRenderer: AtlasLoginServiceRenderer;
  constructor(private preferences: Pick<PreferencesAccess, 'getPreferences'>) {
    this.config = this.getConfig();
    this.atlasLoginServiceRenderer = new AtlasLoginServiceRenderer();
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
        // atlasApiBaseUrl: 'https://cloud.mongodb.com/api/private',
        // atlasApiUnauthBaseUrl: 'https://cloud.mongodb.com/api/private/unauth',
        atlasApiBaseUrl: 'http://localhost:9000/api/private',
        atlasApiUnauthBaseUrl: 'http://localhost:9000/api/private/unauth',
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
  getCurrentUser(): Promise<AtlasUserInfo> {
    return this.atlasLoginServiceRenderer.getUserInfo();
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
    const token = await this.atlasLoginServiceRenderer.getToken({
      signal: init.signal as AbortSignal,
    });
    return await this.unAuthenticatedFetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token ?? ''}`,
      },
    });
  }
  login() {
    return this.atlasLoginServiceRenderer.signIn();
  }
}

export class AtlasService {
  constructor(private httpClient: AtlasHttpApiClient) {}
  privateUnAuthEndpoint(path: string) {
    return this.httpClient.privateUnAuthEndpoint(path);
  }
  privateAtlasEndpoint(path: string) {
    return this.httpClient.privateAtlasEndpoint(path);
  }
  private async makeFetch(
    httpFetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>,
    url: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    throwIfAborted(init?.signal as AbortSignal);
    log.info(
      mongoLogId(1_001_000_297),
      'ErrorAwareAtlasHttpApiClient',
      'Making a fetch',
      {
        url,
      }
    );
    try {
      const res = await httpFetch(url, init);
      await throwIfNotOk(res);
      return res;
    } catch (err) {
      log.info(
        mongoLogId(1_001_000_298),
        'ErrorAwareAtlasHttpApiClient',
        'Fetch errored',
        {
          url,
          err,
        }
      );
      throw err;
    }
  }
  async unAuthenticatedFetch(url: RequestInfo, init?: RequestInit) {
    return this.makeFetch(
      this.httpClient.unAuthenticatedFetch.bind(this.httpClient),
      url,
      init
    );
  }
  async unAuthenticatedFetchJson<T>(
    url: RequestInfo,
    init: RequestInit
  ): Promise<T> {
    const response = await this.unAuthenticatedFetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Accept: 'application/json',
      },
    });
    return await response.json();
  }
  async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.makeFetch(
      this.httpClient.fetch.bind(this.httpClient),
      url,
      init
    );
  }
  async fetchJson<T>(url: RequestInfo, init?: RequestInit): Promise<T> {
    const response = await this.fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Accept: 'application/json',
      },
    });
    return await response.json();
  }
  async getCurrentUser() {
    return this.httpClient.getCurrentUser();
  }
}
