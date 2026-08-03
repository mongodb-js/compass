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

/**
 * The cluster states as reported by the Atlas Admin API, with `paused` and
 * `CREATING` folded in. A cluster that does not exist has no state here - the
 * request 404s and it is up to the caller to interpret that.
 */
export type AtlasClusterComputedState =
  | 'PAUSED'
  | 'PROVISIONING'
  | 'DELETING'
  | 'IDLE'
  | 'UPDATING'
  | 'REPAIRING';

export function computeClusterState(
  cluster: AtlasCluster
): AtlasClusterComputedState {
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
    typeof cluster.stateName === 'string'
  ) {
    return;
  }
  throw new Error(
    'Got unexpected backend response for Atlas Admin API cluster request'
  );
}
