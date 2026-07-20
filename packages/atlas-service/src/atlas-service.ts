import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { AtlasAuthService } from './atlas-auth-service';
import type { AtlasServiceConfig } from './util';
import {
  AtlasServiceError,
  getAtlasConfig,
  throwIfNetworkTrafficDisabled,
  throwIfNotOk,
} from './util';
import type { Logger } from '@mongodb-js/compass-logging';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { type UserDataType } from '@mongodb-js/compass-user-data';
import {
  assertPaginatedResponse,
  buildPaginationQuery,
  ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
} from './util';
import ConnectionString from 'mongodb-connection-string-url';

export type AtlasServiceOptions = {
  defaultHeaders?: Record<string, string>;
};

export type AtlasClusterConnectionStrings = {
  standard?: string;
  standardSrv?: string;
};

type AtlasGroupClusterResponse = {
  name: string;
  connectionStrings?: AtlasClusterConnectionStrings;
};

export type AtlasGroupCluster = {
  clusterName: string;
  connectionStrings: string[];
};

function extractConnectionStrings(
  connectionStrings?: AtlasClusterConnectionStrings
): string[] {
  return [
    ...(connectionStrings?.standardSrv ? [connectionStrings.standardSrv] : []),
    ...(connectionStrings?.standard ? [connectionStrings.standard] : []),
  ];
}

function connectionStringMatches(
  input: ConnectionString,
  candidate: string
): boolean {
  let candidateUrl: ConnectionString;
  try {
    candidateUrl = new ConnectionString(candidate);
  } catch {
    return false;
  }
  if (input.isSRV !== candidateUrl.isSRV) {
    return false;
  }
  const inputFirstHost = input.hosts[0]?.toLowerCase();
  const candidateFirstHost = candidateUrl.hosts[0]?.toLowerCase();
  return inputFirstHost !== undefined && inputFirstHost === candidateFirstHost;
}

export type AtlasAccessListEntry = {
  cidrBlock?: string;
  ipAddress?: string;
  awsSecurityGroup?: string;
  comment?: string;
};

export type AtlasClusterState =
  | 'IDLE'
  | 'CREATING'
  | 'UPDATING'
  | 'DELETING'
  | 'REPAIRING';

export type AtlasCluster = {
  name: string;
  paused: boolean;
  stateName: AtlasClusterState;
  connectionStrings?: AtlasClusterConnectionStrings;
};

export type AtlasClusterComputedState =
  | 'NOT_FOUND'
  | 'PAUSED'
  | 'PROVISIONING'
  | 'DELETING'
  | 'IDLE'
  | 'UPDATING'
  | 'REPAIRING';

function computeClusterState(cluster: AtlasCluster): AtlasClusterComputedState {
  if (cluster.paused) {
    return 'PAUSED';
  }
  switch (cluster.stateName) {
    case 'CREATING':
      return 'PROVISIONING';
    case 'IDLE':
    case 'UPDATING':
    case 'DELETING':
    case 'REPAIRING':
      return cluster.stateName;
  }
}

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

function getAutomationAgentClusterId(
  atlasMetadata: Pick<
    AtlasClusterMetadata,
    'clusterUniqueId' | 'metricsId' | 'metricsType'
  >
): { clusterId: string } | { serverlessId: string } | { flexId: string } {
  if (atlasMetadata.metricsType === 'flex') {
    return { flexId: atlasMetadata.clusterUniqueId };
  }
  if (atlasMetadata.metricsType === 'serverless') {
    return { serverlessId: atlasMetadata.clusterUniqueId };
  }
  return { clusterId: atlasMetadata.metricsId };
}

export class AtlasService {
  private readonly authService: AtlasAuthService;
  private readonly preferences: PreferencesAccess;
  private readonly logger: Logger;
  private readonly options?: AtlasServiceOptions;
  private readonly defaultConfigOverride?: AtlasServiceConfig;
  constructor(
    authService: AtlasAuthService,
    preferences: PreferencesAccess,
    logger: Logger,
    options?: AtlasServiceOptions,
    defaultConfigOverride?: AtlasServiceConfig
  ) {
    this.authService = authService;
    this.preferences = preferences;
    this.logger = logger;
    this.options = options;
    this.defaultConfigOverride = defaultConfigOverride;
  }
  // Config value is dynamic to make sure that process.env overrides are taken
  // into account in runtime
  get config(): AtlasServiceConfig {
    return this.defaultConfigOverride ?? getAtlasConfig(this.preferences);
  }
  privateApiEndpoint(path?: string): string {
    return `${this.config.atlasPrivateApiBaseUrl}${normalizePath(path)}`;
  }
  cloudEndpoint(path?: string): string {
    return `${this.config.cloudBaseUrl}${normalizePath(path)}`;
  }
  adminApiEndpoint(path?: string): string {
    return `${this.config.atlasAdminApiBaseUrl}${normalizePath(path)}`;
  }
  assistantApiEndpoint(path?: string): string {
    return `${this.config.assistantApiBaseUrl}${normalizePath(path)}`;
  }
  regionalizedCloudEndpoint(
    _atlasMetadata: Pick<AtlasClusterMetadata, 'regionalBaseUrl'>,
    path?: string
  ): string {
    // TODO: eventually should apply the regional url logic
    // https://github.com/10gen/mms/blob/9f858bb987aac6aa80acfb86492dd74c89cbb862/client/packages/project/common/ajaxPrefilter.ts#L34-L49
    return this.cloudEndpoint(path);
  }
  userDataEndpoint(
    orgId: string,
    groupId: string,
    type: UserDataType,
    id?: string
  ): string {
    const encodedOrgId = encodeURIComponent(orgId);
    const encodedGroupId = encodeURIComponent(groupId);
    const encodedType = encodeURIComponent(type);
    const encodedId = id ? encodeURIComponent(id) : '';
    const baseUrl = this.config.userDataBaseUrl;
    const path = encodedId
      ? `/${encodedOrgId}/${encodedGroupId}/${encodedType}/${encodedId}`
      : `/${encodedOrgId}/${encodedGroupId}/${encodedType}`;
    return `${baseUrl}${path}`;
  }
  driverProxyEndpoint(path?: string): string {
    return `${this.config.ccsBaseUrl}${normalizePath(path)}`;
  }
  multiplexWebsocketEndpoint(projectId: string): string[] {
    return this.config.multiplexedWsBaseUrls.map(
      (baseUrl) => `${baseUrl}${normalizePath(projectId)}`
    );
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
      const headers = {
        ...this.options?.defaultHeaders,
        ...(shouldAddCSRFHeaders(init?.method) && getCSRFHeaders()),
        ...init?.headers,
      };
      const res = await fetch(url, {
        ...init,
        headers,
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
    return this.fetch(url, {
      ...init,
      headers: {
        ...init?.headers,
        ['X-Compass-Auth']: 'true',
      },
      credentials: 'include',
    });
  }
  async automationAgentRequest(
    atlasMetadata: AtlasClusterMetadata,
    opType: string,
    opBody: Record<string, unknown>
  ): Promise<{ _id: string; requestType: string } | undefined> {
    const opBodyClusterId = getAutomationAgentClusterId(atlasMetadata);
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

  async listGroupIds(): Promise<string[]> {
    const groupIds = new Set<string>();
    let pageNum = 1;
    for (;;) {
      const requestUrl = this.adminApiEndpoint(
        `/v2/clusters${buildPaginationQuery({
          pageNum,
          itemsPerPage: ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
        })}`
      );
      const json: unknown = await this.authenticatedFetch(requestUrl, {
        method: 'GET',
      }).then((res) => res.json());
      assertPaginatedResponse<{ groupId: string }>(json);
      for (const cluster of json.results) {
        groupIds.add(cluster.groupId);
      }
      if (json.results.length < ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE) {
        return [...groupIds];
      }
      pageNum++;
    }
  }

  async listConnectionStrings(groupId: string): Promise<AtlasGroupCluster[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    const clusters: AtlasGroupCluster[] = [];
    let pageNum = 1;
    for (;;) {
      const requestUrl = this.adminApiEndpoint(
        `/v2/groups/${encodedGroupId}/clusters${buildPaginationQuery({
          pageNum,
          itemsPerPage: ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
        })}`
      );
      const json: unknown = await this.authenticatedFetch(requestUrl, {
        method: 'GET',
      }).then((res) => res.json());
      assertPaginatedResponse<AtlasGroupClusterResponse>(json);
      for (const cluster of json.results) {
        clusters.push({
          clusterName: cluster.name,
          connectionStrings: extractConnectionStrings(
            cluster.connectionStrings
          ),
        });
      }
      if (json.results.length < ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE) {
        return clusters;
      }
      pageNum++;
    }
  }

  async getProjectNameAndClusterId(
    connectionString: string
  ): Promise<{ projectId: string; clusterName: string } | undefined> {
    let input: ConnectionString;
    try {
      input = new ConnectionString(connectionString);
    } catch {
      return undefined;
    }
    const groupIds = await this.listGroupIds();
    for (const groupId of groupIds) {
      const clusters = await this.listConnectionStrings(groupId);
      for (const cluster of clusters) {
        if (
          cluster.connectionStrings.some((candidate) =>
            connectionStringMatches(input, candidate)
          )
        ) {
          return { projectId: groupId, clusterName: cluster.clusterName };
        }
      }
    }
    return undefined;
  }

  async getClusterState(
    groupId: string,
    clusterName: string
  ): Promise<AtlasClusterComputedState> {
    const encodedGroupId = encodeURIComponent(groupId);
    const encodedClusterName = encodeURIComponent(clusterName);
    const requestUrl = this.adminApiEndpoint(
      `/v2/groups/${encodedGroupId}/clusters/${encodedClusterName}`
    );
    let json: unknown;
    try {
      json = await this.authenticatedFetch(requestUrl, {
        method: 'GET',
      }).then((res) => res.json());
    } catch (err) {
      if (err instanceof AtlasServiceError && err.statusCode === 404) {
        return 'NOT_FOUND';
      }
      throw err;
    }
    assertClusterState(json);
    return computeClusterState(json);
  }

  /**
   * Returns the project IP access list entries, paging through every entry.
   */
  async getProjectIPAccessList(
    groupId: string
  ): Promise<AtlasAccessListEntry[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    const entries: AtlasAccessListEntry[] = [];
    let pageNum = 1;
    for (;;) {
      const requestUrl = this.adminApiEndpoint(
        `/v2/groups/${encodedGroupId}/accessList${buildPaginationQuery({
          pageNum,
          itemsPerPage: ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
        })}`
      );
      const json: unknown = await this.authenticatedFetch(requestUrl, {
        method: 'GET',
      }).then((res) => res.json());
      assertPaginatedResponse<AtlasAccessListEntry>(json);
      entries.push(...json.results);
      if (json.results.length < ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE) {
        return entries;
      }
      pageNum++;
    }
  }
}

function assertClusterState(json: unknown): asserts json is AtlasCluster {
  const cluster = json as {
    name?: unknown;
    paused?: unknown;
    stateName?: unknown;
  };
  if (
    json &&
    typeof json === 'object' &&
    typeof cluster.name === 'string' &&
    typeof cluster.paused === 'boolean' &&
    typeof cluster.stateName === 'string'
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for Atlas Admin API cluster request'
  );
}

function assertAutomationAgentRequestResponse(
  json: unknown,
  opType: string
): asserts json is { _id: string; requestType: string } {
  const body = json as { _id?: unknown; requestType?: unknown };
  if (
    json &&
    typeof json === 'object' &&
    Object.prototype.hasOwnProperty.call(json, '_id') &&
    Object.prototype.hasOwnProperty.call(json, 'requestType') &&
    body.requestType === opType
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for automation agent request'
  );
}

function assertAutomationAgentAwaitResponse<T>(
  json: unknown,
  opType: string
): asserts json is { _id: string; requestType: string; response: T[] } {
  const body = json as { requestType?: unknown };
  if (
    json &&
    typeof json === 'object' &&
    Object.prototype.hasOwnProperty.call(json, '_id') &&
    Object.prototype.hasOwnProperty.call(json, 'requestType') &&
    Object.prototype.hasOwnProperty.call(json, 'response') &&
    body.requestType === opType
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for automation agent request await'
  );
}
