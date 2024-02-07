import { ipcRenderer } from 'hadron-ipc';
import type { CompassAtlasHttpApiClient as CompassAtlasHttpApiClientMain } from '../main';
import { throwIfNotOk } from '../util';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { RequestInfo, RequestInit, Response } from 'node-fetch';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-ATLAS-SERVICE');

export interface AtlasHttpApiClient {
  oauthEndpoint(opts: { path: string }): Promise<string>;
  privateUnAuthEndpoint(opts: { path: string }): Promise<string>;
  privateAtlasEndpoint(opts: { path: string }): Promise<string>;
  fetch(opts: { url: RequestInfo; init: RequestInit }): Promise<Response>;
  unAuthenticatedFetch(opts: {
    url: RequestInfo;
    init: RequestInit;
  }): Promise<Response>;
}

export class ErrorAwareAtlasHttpApiClient {
  constructor(private httpClient: AtlasHttpApiClient) {}

  oauthEndpoint(path: string) {
    return this.httpClient.oauthEndpoint({ path });
  }

  privateUnAuthEndpoint(path: string) {
    return this.httpClient.privateUnAuthEndpoint({ path });
  }

  privateAtlasEndpoint(path: string) {
    return this.httpClient.privateAtlasEndpoint({ path });
  }

  private async makeFetch(
    httpFetch: (opts: {
      url: RequestInfo;
      init: RequestInit;
    }) => Promise<Response>,
    url: RequestInfo,
    init: RequestInit
  ): Promise<Response> {
    throwIfAborted(init.signal as AbortSignal);
    log.info(
      mongoLogId(1_001_000_297),
      'ErrorAwareAtlasHttpApiClient',
      'Making a fetch',
      {
        url,
      }
    );
    try {
      const res = await httpFetch({ url, init });
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

  async unAuthenticatedFetch(url: RequestInfo, init: RequestInit) {
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

  async fetch(url: RequestInfo, init: RequestInit): Promise<Response> {
    return this.makeFetch(
      this.httpClient.fetch.bind(this.httpClient),
      url,
      init
    );
  }

  async fetchJson<T>(url: RequestInfo, init: RequestInit): Promise<T> {
    const response = await this.fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Accept: 'application/json',
      },
    });
    return await response.json();
  }
}

let compassAtlasHttpApiClientSingleton: CompassAtlasHttpApiClient;
export class CompassAtlasHttpApiClient implements AtlasHttpApiClient {
  private _ipc = ipcRenderer?.createInvoke<
    ReturnType<typeof CompassAtlasHttpApiClientMain.getInstance>,
    | 'oauthEndpoint'
    | 'privateUnAuthEndpoint'
    | 'privateAtlasEndpoint'
    | 'unAuthenticatedFetch'
    | 'fetch'
  >('CompassAtlasHttpApiClient', [
    'oauthEndpoint',
    'privateUnAuthEndpoint',
    'privateAtlasEndpoint',
    'unAuthenticatedFetch',
    'fetch',
  ]);

  constructor() {
    if (compassAtlasHttpApiClientSingleton) {
      return compassAtlasHttpApiClientSingleton;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    compassAtlasHttpApiClientSingleton = this;
  }

  private get ipc() {
    if (!this._ipc) {
      throw new Error('IPC not available');
    }
    return this._ipc;
  }

  get oauthEndpoint() {
    return this.ipc.oauthEndpoint;
  }
  get privateUnAuthEndpoint() {
    return this.ipc.privateUnAuthEndpoint;
  }
  get privateAtlasEndpoint() {
    return this.ipc.privateAtlasEndpoint;
  }
  get fetch() {
    return this.ipc.fetch;
  }
  get unAuthenticatedFetch() {
    return this.ipc.unAuthenticatedFetch;
  }
}
