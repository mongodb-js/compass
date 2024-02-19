import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { AtlasAuthService } from './atlas-auth-service';
import type { AtlasServiceConfig } from './util';
import {
  getAtlasConfig,
  throwIfNetworkTrafficDisabled,
  throwIfNotOk,
} from './util';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';

type AtlasServiceOptions = {
  defaultHeaders: Record<string, string>;
};

export class AtlasService {
  private config: AtlasServiceConfig;
  constructor(
    private readonly authService: AtlasAuthService,
    private readonly preferences: PreferencesAccess,
    private readonly logger: LoggerAndTelemetry,
    private readonly options?: AtlasServiceOptions
  ) {
    this.config = getAtlasConfig(preferences);
  }
  privateUnAuthEndpoint(path: string): string {
    return `${this.config.atlasApiUnauthBaseUrl}/${path}`;
  }
  privateAtlasEndpoint(path: string): string {
    return `${this.config.atlasApiBaseUrl}/${path}`;
  }
  async fetch(url: RequestInfo, init?: RequestInit): Promise<Response> {
    throwIfNetworkTrafficDisabled(this.preferences);
    throwIfAborted(init?.signal as AbortSignal);
    this.logger.log.info(
      this.logger.mongoLogId(1_001_000_297),
      'AtlasService',
      'Making a fetch',
      {
        url,
      }
    );
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          ...this.options?.defaultHeaders,
          ...init?.headers,
        },
      });
      await throwIfNotOk(res);
      return res;
    } catch (err) {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_298),
        'AtlasService',
        'Fetch errored',
        {
          url,
          err,
        }
      );
      throw err;
    }
  }

  async authenticatedFetch(
    url: RequestInfo,
    init?: RequestInit
  ): Promise<Response> {
    const authHeaders = await this.authService.getAuthHeaders();
    return this.fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        ...authHeaders,
      },
    });
  }
}
