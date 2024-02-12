import { throwIfAborted } from '@mongodb-js/compass-utils';
import { AtlasHttpApiClient } from './atlas-http-api-client';
import { throwIfNotOk } from './util';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { AtlasUserData } from './atlas-user';
import { PreferencesAccess } from 'compass-preferences-model';
const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-ATLAS-SERVICE');
import {
  disableAIFeature,
  enableAIFeature,
} from './store/atlas-signin-reducer';
import { getStore } from './store/atlas-signin-store';

export class AtlasService {
  private httpClient: AtlasHttpApiClient;
  constructor(
    private atlasUser: AtlasUserData,
    preferences: Pick<PreferencesAccess, 'getPreferences'>
  ) {
    this.httpClient = new AtlasHttpApiClient(preferences);
  }
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
    return this.atlasUser.getUser();
  }
  async disableAIFeature() {
    await getStore().dispatch(disableAIFeature());
    this.atlasUser.updateConfig({ enabledAIFeature: false });
  }
  async enableAIFeature() {
    const accepted = await getStore().dispatch(enableAIFeature());
    await this.atlasUser.updateConfig({ enabledAIFeature: accepted });
    if (!accepted) {
      throw new Error('Terms and conditions were not accepted');
    }
  }
}
