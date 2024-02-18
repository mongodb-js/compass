import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { AtlasHttpApiClient } from './atlas-http-api-client';
import { throwIfNetworkTrafficDisabled, throwIfNotOk } from './util';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';

export class AtlasService {
  constructor(
    private readonly atlasHttpClient: AtlasHttpApiClient,
    private readonly preferences: PreferencesAccess,
    private readonly logger: LoggerAndTelemetry
  ) {}
  privateUnAuthEndpoint(path: string) {
    return this.atlasHttpClient.privateUnAuthEndpoint(path);
  }
  privateAtlasEndpoint(path: string) {
    return this.atlasHttpClient.privateAtlasEndpoint(path);
  }
  private async makeFetch(
    httpFetch: (url: RequestInfo, init?: RequestInit) => Promise<Response>,
    url: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    throwIfNetworkTrafficDisabled(this.preferences);
    throwIfAborted(init?.signal as AbortSignal);
    this.logger.log.info(
      this.logger.mongoLogId(1_001_000_297),
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
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_298),
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
      this.atlasHttpClient.unAuthenticatedFetch.bind(this.atlasHttpClient),
      url,
      init
    );
  }
  async unAuthenticatedFetchJson<T>(
    url: RequestInfo,
    init?: RequestInit
  ): Promise<T> {
    const response = await this.unAuthenticatedFetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        Accept: 'application/json',
      },
    });
    return await response.json();
  }
  async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    return this.makeFetch(
      this.atlasHttpClient.fetch.bind(this.atlasHttpClient),
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
}
