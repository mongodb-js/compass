import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { AtlasAuthService } from './atlas-auth-service';
import type { AtlasServiceConfig } from './util';
import {
  getAtlasConfig,
  throwIfNetworkTrafficDisabled,
  throwIfNotOk,
} from './util';
import type { Logger } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';

export type AtlasServiceOptions = {
  defaultHeaders?: Record<string, string>;
};

function normalizePath(path?: string) {
  path = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return encodeURI(path);
}

function getCSRFHeaders() {
  return {
    'X-CSRF-Token':
      document
        .querySelector('meta[name="csrf-token" i]')
        ?.getAttribute('content') ?? '',
    'X-CSRF-Time':
      document
        .querySelector('meta[name="csrf-time" i]')
        ?.getAttribute('content') ?? '',
  };
}

function shouldAddCSRFHeaders(method = 'get') {
  return !/^(get|head|options|trace)$/.test(method.toLowerCase());
}

export class AtlasService {
  private config: AtlasServiceConfig;
  constructor(
    private readonly authService: AtlasAuthService,
    private readonly preferences: PreferencesAccess,
    private readonly logger: Logger,
    private readonly options?: AtlasServiceOptions
  ) {
    this.config = getAtlasConfig(preferences);
  }
  adminApiEndpoint(path?: string): string {
    return `${this.config.atlasApiBaseUrl}${normalizePath(path)}`;
  }
  cloudEndpoint(path?: string): string {
    return `${this.config.cloudBaseUrl}${normalizePath(path)}`;
  }
  regionalizedCloudEndpoint(
    _atlasMetadata: Pick<AtlasClusterMetadata, 'regionalBaseUrl'>,
    path?: string
  ): string {
    // TODO: eventually should apply the regional url logic
    // https://github.com/10gen/mms/blob/9f858bb987aac6aa80acfb86492dd74c89cbb862/client/packages/project/common/ajaxPrefilter.ts#L34-L49
    return this.cloudEndpoint(path);
  }
  driverProxyEndpoint(path?: string): string {
    return `${this.config.wsBaseUrl}${normalizePath(path)}`;
  }
  async fetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    throwIfNetworkTrafficDisabled(this.preferences);
    throwIfAborted(init?.signal as AbortSignal);
    this.logger.log.info(
      this.logger.mongoLogId(1_001_000_297),
      'AtlasService',
      'Making a fetch',
      { url }
    );
    try {
      const res = await fetch(url, {
        ...init,
        headers: {
          ...this.options?.defaultHeaders,
          ...(shouldAddCSRFHeaders(init?.method) && getCSRFHeaders()),
          ...init?.headers,
        },
      });
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_309),
        'AtlasService',
        'Received API response',
        {
          url,
          status: res.status,
          statusText: res.statusText,
        }
      );
      await throwIfNotOk(res);
      return res;
    } catch (err) {
      this.logger.log.info(
        this.logger.mongoLogId(1_001_000_298),
        'AtlasService',
        'Fetch errored',
        { url, err }
      );
      throw err;
    }
  }
  async authenticatedFetch(
    url: RequestInfo | URL,
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
  async automationAgentRequest(
    atlasMetadata: AtlasClusterMetadata,
    opType: string,
    opBody: Record<string, unknown>
  ): Promise<{ _id: string; requestType: string } | undefined> {
    const opBodyClusterId =
      atlasMetadata.metricsType === 'serverless'
        ? { serverlessId: atlasMetadata.clusterUniqueId }
        : { clusterId: atlasMetadata.metricsId };
    const requestUrl = this.regionalizedCloudEndpoint(
      atlasMetadata,
      `/explorer/v1/groups/${atlasMetadata.projectId}/requests/${opType}`
    );
    const json = await this.authenticatedFetch(requestUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ ...opBodyClusterId, ...opBody }),
    }).then((res) => {
      if (
        res.headers
          .get('content-type')
          ?.toLowerCase()
          .includes('application/json')
      ) {
        return res.json();
      }
    });
    assertAutomationAgentRequestResponse(json, opType);
    return json;
  }
  async automationAgentAwait<T>(
    atlasMetadata: AtlasClusterMetadata,
    opType: string,
    requestId: string
  ): Promise<{
    _id: string;
    requestType: string;
    response: T[];
  }> {
    const requestUrl = this.regionalizedCloudEndpoint(
      atlasMetadata,
      `/explorer/v1/groups/${atlasMetadata.projectId}/requests/${requestId}/types/${opType}/await`
    );
    const json = await this.authenticatedFetch(requestUrl, {
      method: 'GET',
    }).then((res) => {
      return res.json();
    });
    assertAutomationAgentAwaitResponse<T>(json, opType);
    return json;
  }
}

function assertAutomationAgentRequestResponse(
  json: any,
  opType: string
): asserts json is { _id: string; requestType: string } {
  if (
    Object.prototype.hasOwnProperty.call(json, '_id') &&
    Object.prototype.hasOwnProperty.call(json, 'requestType') &&
    json.requestType === opType
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for automation agent request'
  );
}

function assertAutomationAgentAwaitResponse<T>(
  json: any,
  opType: string
): asserts json is { _id: string; requestType: string; response: T[] } {
  if (
    Object.prototype.hasOwnProperty.call(json, '_id') &&
    Object.prototype.hasOwnProperty.call(json, 'requestType') &&
    Object.prototype.hasOwnProperty.call(json, 'response') &&
    json.requestType === opType
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for automation agent request await'
  );
}
