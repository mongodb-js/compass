export type AtlasServiceOptions = {
  defaultHeaders?: Record<string, string>;
};

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
