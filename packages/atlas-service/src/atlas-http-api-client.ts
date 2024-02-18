import { getAppName, getAppVersion } from '@mongodb-js/compass-utils';
import type { AtlasServiceConfig } from './util';

export class AtlasHttpApiClient {
  constructor(
    private readonly config: AtlasServiceConfig,
    private readonly getAuthHeadersFn?: () => Promise<Record<string, string>>
  ) {}
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
    const appName = getAppName();
    const appVersion = getAppVersion();
    const headers = {
      ...init.headers,
      ...(appName &&
        appVersion && {
          'User-Agent': `${appName}/${appVersion}`,
        }),
    };
    return await fetch(url, {
      ...init,
      headers,
    });
  };
  async fetch(url: RequestInfo, init: RequestInit = {}): Promise<Response> {
    return await this.unAuthenticatedFetch(url, {
      ...init,
      headers: {
        ...init.headers,
        ...(await this.getAuthHeadersFn?.()),
      },
    });
  }
}
