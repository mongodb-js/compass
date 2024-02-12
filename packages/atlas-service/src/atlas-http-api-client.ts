import { getAppName, getAppVersion } from '@mongodb-js/compass-utils';
import { AtlasServiceConfig } from './util';
import { AtlasAuthService as AtlasAuthServiceRenderer } from './renderer';

export class AtlasHttpApiClient {
  private atlasLoginServiceRenderer: AtlasAuthServiceRenderer;
  constructor(private config: AtlasServiceConfig) {
    this.atlasLoginServiceRenderer = new AtlasAuthServiceRenderer();
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
