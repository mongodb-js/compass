import ConnectionString from 'mongodb-connection-string-url';
import { type AtlasService } from '@mongodb-js/atlas-service/provider';

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

export type AtlasAccessListEntry = {
  cidrBlock?: string;
  ipAddress?: string;
  awsSecurityGroup?: string;
  comment?: string;
};

export const ATLAS_CLUSTER_STATES = [
  'IDLE',
  'CREATING',
  'UPDATING',
  'DELETING',
  'REPAIRING',
] as const;

export type AtlasClusterState = (typeof ATLAS_CLUSTER_STATES)[number];

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

const ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE = 100;

type AtlasPaginationOptions = {
  pageNum?: number;
  itemsPerPage?: number;
};

type AtlasPaginatedResponse<T> = {
  results: T[];
  totalCount: number;
};

function buildPaginationQuery(pagination?: AtlasPaginationOptions): string {
  const params = new URLSearchParams();
  if (pagination?.pageNum !== undefined) {
    params.set('pageNum', String(pagination.pageNum));
  }
  if (pagination?.itemsPerPage !== undefined) {
    params.set('itemsPerPage', String(pagination.itemsPerPage));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

function assertPaginatedResponse<T>(
  json: unknown
): asserts json is AtlasPaginatedResponse<T> {
  if (
    json &&
    typeof json === 'object' &&
    Array.isArray((json as { results?: unknown }).results) &&
    typeof (json as { totalCount?: unknown }).totalCount === 'number'
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for Atlas Admin API paginated request'
  );
}

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

function computeClusterState(cluster: AtlasCluster): AtlasClusterComputedState {
  if (cluster.paused) {
    return 'PAUSED';
  }
  switch (cluster.stateName) {
    case 'CREATING':
      return 'PROVISIONING';
    default:
      return cluster.stateName;
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

function isNotFoundError(err: unknown): boolean {
  return (
    !!err &&
    typeof err === 'object' &&
    (err as { statusCode?: unknown }).statusCode === 404
  );
}

/**
 * Provides access to the Atlas Admin API cluster endpoints. Injects an
 * AtlasService and uses it internally for network requests, keeping the
 * concrete admin-API routes (and the pagination plumbing they need) scoped to
 * where they are used.
 */
export class AtlasClusterService {
  private readonly atlasService: Pick<
    AtlasService,
    'adminApiEndpoint' | 'authenticatedFetch'
  >;

  constructor(
    atlasService: Pick<AtlasService, 'adminApiEndpoint' | 'authenticatedFetch'>
  ) {
    this.atlasService = atlasService;
  }

  /**
   * Generic batch fetcher for Atlas Admin API paginated endpoints. Pages
   * through every result, delegating the concrete endpoint URL (including its
   * pagination query) to the caller so this stays agnostic of any specific
   * admin-API route.
   */
  private async fetchAllPages<T>(
    buildEndpoint: (pagination: AtlasPaginationOptions) => string,
    init?: RequestInit
  ): Promise<T[]> {
    const results: T[] = [];
    let pageNum = 1;
    for (;;) {
      const requestUrl = buildEndpoint({
        pageNum,
        itemsPerPage: ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE,
      });
      const json: unknown = await this.atlasService
        .authenticatedFetch(requestUrl, {
          ...init,
          method: 'GET',
        })
        .then((res) => res.json());
      assertPaginatedResponse<T>(json);
      results.push(...json.results);
      if (json.results.length < ATLAS_ADMIN_API_MAX_ITEMS_PER_PAGE) {
        return results;
      }
      pageNum++;
    }
  }

  async listGroupIds(): Promise<string[]> {
    const clusters = await this.fetchAllPages<{ groupId: string }>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/clusters${buildPaginationQuery(pagination)}`
        )
    );
    return [...new Set(clusters.map((cluster) => cluster.groupId))];
  }

  async listConnectionStrings(groupId: string): Promise<AtlasGroupCluster[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    const clusters = await this.fetchAllPages<AtlasGroupClusterResponse>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/groups/${encodedGroupId}/clusters${buildPaginationQuery(
            pagination
          )}`
        )
    );
    return clusters.map((cluster) => ({
      clusterName: cluster.name,
      connectionStrings: extractConnectionStrings(cluster.connectionStrings),
    }));
  }

  async getProjectIdAndClusterName(
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
    const requestUrl = this.atlasService.adminApiEndpoint(
      `/v2/groups/${encodedGroupId}/clusters/${encodedClusterName}`
    );
    let json: unknown;
    try {
      json = await this.atlasService
        .authenticatedFetch(requestUrl, {
          method: 'GET',
        })
        .then((res) => res.json());
    } catch (err) {
      if (isNotFoundError(err)) {
        return 'NOT_FOUND';
      }
      throw err;
    }
    assertClusterState(json);
    return computeClusterState(json);
  }

  async getProjectIPAccessList(
    groupId: string
  ): Promise<AtlasAccessListEntry[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    return await this.fetchAllPages<AtlasAccessListEntry>((pagination) =>
      this.atlasService.adminApiEndpoint(
        `/v2/groups/${encodedGroupId}/accessList${buildPaginationQuery(
          pagination
        )}`
      )
    );
  }
}
