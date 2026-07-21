import ConnectionString from 'mongodb-connection-string-url';
import {
  type AtlasService,
  AtlasServiceError,
  buildPaginationQuery,
} from '@mongodb-js/atlas-service/provider';

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

function isAtlasClusterState(value: unknown): value is AtlasClusterState {
  return (ATLAS_CLUSTER_STATES as readonly string[]).includes(value as string);
}

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
    case 'IDLE':
    case 'UPDATING':
    case 'DELETING':
    case 'REPAIRING':
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
    isAtlasClusterState(cluster.stateName)
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for Atlas Admin API cluster request'
  );
}

/**
 * Provides access to the Atlas Admin API cluster endpoints. Injects an
 * AtlasService and uses it internally for network requests, keeping the
 * concrete admin-API routes scoped to where they are used.
 */
export class AtlasClusterService {
  private readonly atlasService: Pick<
    AtlasService,
    'adminApiEndpoint' | 'authenticatedFetch' | 'fetchAllPages'
  >;

  constructor(
    atlasService: Pick<
      AtlasService,
      'adminApiEndpoint' | 'authenticatedFetch' | 'fetchAllPages'
    >
  ) {
    this.atlasService = atlasService;
  }

  async listGroupIds(): Promise<string[]> {
    const clusters = await this.atlasService.fetchAllPages<{ groupId: string }>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/clusters${buildPaginationQuery(pagination)}`
        )
    );
    return [...new Set(clusters.map((cluster) => cluster.groupId))];
  }

  async listConnectionStrings(groupId: string): Promise<AtlasGroupCluster[]> {
    const encodedGroupId = encodeURIComponent(groupId);
    const clusters =
      await this.atlasService.fetchAllPages<AtlasGroupClusterResponse>(
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
      if (err instanceof AtlasServiceError && err.statusCode === 404) {
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
    return await this.atlasService.fetchAllPages<AtlasAccessListEntry>(
      (pagination) =>
        this.atlasService.adminApiEndpoint(
          `/v2/groups/${encodedGroupId}/accessList${buildPaginationQuery(
            pagination
          )}`
        )
    );
  }
}
