import type { components } from '../openapi/v2';
import type { Response } from './openapi-helpers';

export type AtlasClusterConnectionStrings =
  components['schemas']['ClusterConnectionStrings'];

export type AtlasGroupClusterResponse =
  Response<'listGroupClusters'>['results'][number];

export type AtlasGroupCluster = {
  clusterName: string;
  connectionStrings: string[];
};

export type AtlasAccessListEntry =
  Response<'listGroupAccessListEntries'>['results'][number];

export type AtlasClusterState = NonNullable<
  Response<'getGroupCluster'>['stateName']
>;

export const ATLAS_CLUSTER_STATES = [
  'IDLE',
  'CREATING',
  'UPDATING',
  'DELETING',
  'REPAIRING',
] as const satisfies readonly AtlasClusterState[];

// Fails to compile when the schema gains a state that is missing above.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _AllStatesListed<
  T extends (typeof ATLAS_CLUSTER_STATES)[number] = AtlasClusterState
> = T;

type RequiredClusterFields = 'name' | 'paused' | 'stateName';

export type AtlasCluster = Omit<
  Response<'getGroupCluster'>,
  RequiredClusterFields
> &
  Required<Pick<Response<'getGroupCluster'>, RequiredClusterFields>>;

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
