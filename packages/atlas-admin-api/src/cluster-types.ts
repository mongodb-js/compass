export type AtlasClusterConnectionStrings = {
  standard?: string;
  standardSrv?: string;
};

export type AtlasGroupClusterResponse = {
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

export function assertClusterState(
  json: unknown
): asserts json is AtlasCluster {
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
    typeof cluster.stateName === 'string' &&
    ATLAS_CLUSTER_STATES.includes(cluster.stateName as AtlasClusterState)
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for Atlas Admin API cluster request'
  );
}
