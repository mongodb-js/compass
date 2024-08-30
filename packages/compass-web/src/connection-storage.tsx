import React, { useContext, useRef } from 'react';
import type {
  ConnectionStorage,
  ConnectionInfo,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';
import ConnectionString from 'mongodb-connection-string-url';
import { createServiceProvider } from 'hadron-app-registry';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';

type ElectableSpecs = {
  instanceSize?: string;
};

type RegionConfig = {
  priority: number;
  electableSpecs: ElectableSpecs;
};

type ReplicationSpec = {
  regionConfigs: RegionConfig[];
};

type ClusterDescription = {
  '@provider': string;
  uniqueId: string;
  groupId: string;
  name: string;
  clusterType: string;
  srvAddress: string;
  state: string;
  deploymentItemName: string;
  replicationSpecList?: ReplicationSpec[];
};

type ClusterDescriptionWithDataProcessingRegion = ClusterDescription & {
  dataProcessingRegion: { regionalUrl: string };
};

type ReplicaSetDeploymentItem = {
  _id: string;
  state: {
    clusterId: string;
  };
};

type ShardingDeploymentItem = {
  name: string;
  state: {
    clusterId: string;
  };
};

type Deployment = {
  replicaSets?: ReplicaSetDeploymentItem[];
  sharding?: ShardingDeploymentItem[];
};

function findDeploymentItemByClusterName(
  description: ClusterDescription,
  deployment: Deployment
): ReplicaSetDeploymentItem | ShardingDeploymentItem | undefined {
  if (isSharded(description)) {
    return (deployment.sharding ?? []).find((item) => {
      return item.name === description.deploymentItemName;
    });
  }

  return (deployment.replicaSets ?? []).find((item) => {
    return item._id === description.deploymentItemName;
  });
}

function isServerless(clusterDescription: ClusterDescription) {
  return clusterDescription['@provider'] === 'SERVERLESS';
}

function isSharded(clusterDescription: ClusterDescription) {
  return (
    clusterDescription.clusterType === 'SHARDED' ||
    clusterDescription.clusterType === 'GEOSHARDED'
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getMetricsIdAndType(
  clusterDescription: ClusterDescription,
  deploymentItem?: ReplicaSetDeploymentItem | ShardingDeploymentItem
): {
  clusterId: string;
  clusterType: 'serverless' | 'replicaSet' | 'cluster';
} {
  if (isServerless(clusterDescription)) {
    return { clusterId: clusterDescription.name, clusterType: 'serverless' };
  }

  if (!deploymentItem) {
    throw new Error(
      "Can't build metrics info when deployment item is not found"
    );
  }

  return {
    clusterId: deploymentItem.state.clusterId,
    clusterType: isSharded(clusterDescription) ? 'cluster' : 'replicaSet',
  };
}

// At the time of writing these are the possible instance sizes. If we main the
// list here, then we'll have to maintain it..
// free: 'M0',
// shared: 'M2', 'M5',
// serverless: 'SERVERLESS_V2', 'USS',
// dedicated: 'M10', 'M100', 'M140', 'M20', 'M200', 'M250', 'M200_NVME', 'M30', 'M300', 'M300_NVME', 'M40', 'M400', 'M400_NVME', 'M40_NVME', 'M50', 'M50_NVME', 'M600_NVME', 'M60', 'M60_NVME', 'M600', 'M700', 'M80', 'M80_NVME', 'M90', 'R200', 'R300', 'R40', 'R400', 'R50', 'R60', 'R600', 'R700', 'R80',
function getInstanceSize(
  clusterDescription: ClusterDescription
): string | undefined {
  return getFirstInstanceSize(clusterDescription.replicationSpecList);
}

function getFirstInstanceSize(
  replicationSpecs?: ReplicationSpec[]
): string | undefined {
  if (!replicationSpecs || replicationSpecs.length === 0) {
    return undefined;
  }
  const preferredRegion = getPreferredRegion(replicationSpecs[0]);
  if (!preferredRegion) {
    return undefined;
  }
  return preferredRegion.electableSpecs.instanceSize;
}

// TODO: rather than hardcode this here, maybe we should just sort regionConfigs
// by priority and take the highest one?
const MAX_PRIORITY = 7;

function getPreferredRegion(
  replicationSpec: ReplicationSpec
): RegionConfig | undefined {
  return replicationSpec.regionConfigs.find(
    (regionConfig) => regionConfig.priority === MAX_PRIORITY
  );
}

export function isFreeOrSharedTierCluster(
  instanceSize: string | undefined
): boolean {
  return instanceSize ? ['M0', 'M2', 'M5'].indexOf(instanceSize) !== -1 : false;
}

export function buildConnectionInfoFromClusterDescription(
  driverProxyEndpoint: string,
  orgId: string,
  projectId: string,
  description: ClusterDescriptionWithDataProcessingRegion,
  deployment: Deployment
) {
  const connectionString = new ConnectionString(
    `mongodb+srv://${description.srvAddress}`
  );

  // Special connection options for cloud env, we will not actually pass
  // certs when establishing the connection on the client, but the proxy
  // server will provide cert resolved from cloud backend
  connectionString.searchParams.set('tls', 'true');
  connectionString.searchParams.set('authMechanism', 'MONGODB-X509');
  connectionString.searchParams.set('authSource', '$external');

  // Limit connection pool for replicas and sharded
  connectionString.searchParams.set('maxPoolSize', '3');
  if (isSharded(description)) {
    connectionString.searchParams.set('srvMaxHosts', '3');
  }

  const deploymentItem = findDeploymentItemByClusterName(
    description,
    deployment
  );

  const metricsAndType = getMetricsIdAndType(description, deploymentItem);
  const { clusterType } = metricsAndType;

  const instanceSize = getInstanceSize(description);
  const supportsRollingIndexes =
    !isFreeOrSharedTierCluster(instanceSize) &&
    (clusterType === 'cluster' || clusterType === 'replicaSet');

  return {
    // Cluster name is unique inside the project (hence using it in the backend
    // urls as identifier) and using it as an id makes our job of mapping routes
    // to compass state easier
    id: description.name,
    connectionOptions: {
      connectionString: connectionString.toString(),
      lookup: () => {
        return {
          wsURL: driverProxyEndpoint,
          projectId: projectId,
          clusterName: description.name,
          srvAddress: description.srvAddress,
        };
      },
    },
    atlasMetadata: {
      orgId: orgId,
      projectId: projectId,
      clusterName: description.name,
      regionalBaseUrl: description.dataProcessingRegion.regionalUrl,
      ...metricsAndType,
      // TODO: I'm not sure that we should put instanceSize on here because
      // right now we're only using it to calculate supportsRollingIndexes
      instanceSize,
      supportsRollingIndexes,
    },
  };
}

class AtlasCloudConnectionStorage
  extends InMemoryConnectionStorage
  implements ConnectionStorage
{
  private loadAllPromise: Promise<ConnectionInfo[]> | undefined;
  constructor(
    private atlasService: AtlasService,
    private orgId: string,
    private projectId: string
  ) {
    super();
  }
  async load({ id }: { id: string }): Promise<ConnectionInfo | undefined> {
    return (await this.loadAll()).find((info) => {
      return info.id === id;
    });
  }

  private async _loadAndNormalizeClusterDescriptionInfo(): Promise<
    ConnectionInfo[]
  > {
    const [clusterDescriptions, deployment] = await Promise.all([
      this.atlasService
        .authenticatedFetch(
          // TODO(CLOUDP-249088): replace with the list request that already
          // contains regional data when it exists instead of fetching
          // one-by-one after the list fetch
          this.atlasService.cloudEndpoint(`nds/clusters/${this.projectId}`)
        )
        .then((res) => {
          return res.json() as Promise<ClusterDescription[]>;
        })
        .then((descriptions) => {
          return Promise.all(
            descriptions
              .filter((description) => {
                // Only list fully deployed clusters
                // TODO(COMPASS-8228): We should probably list all and just
                // account in the UI for a special state of a deployment as
                // clusters can become inactive during their runtime and it's
                // valuable UI info to display
                return !!description.srvAddress;
              })
              .map(async (description) => {
                // Even though nds/clusters will list serverless clusters, to get
                // the regional description we need to change the url
                const clusterType = isServerless(description)
                  ? 'serverless'
                  : 'clusters';
                const res = await this.atlasService.authenticatedFetch(
                  this.atlasService.cloudEndpoint(
                    `nds/${clusterType}/${this.projectId}/${description.name}/regional/clusterDescription`
                  )
                );
                return await (res.json() as Promise<ClusterDescriptionWithDataProcessingRegion>);
              })
          );
        }),
      this.atlasService
        .authenticatedFetch(
          this.atlasService.cloudEndpoint(`deployment/${this.projectId}`)
        )
        .then((res) => {
          return res.json() as Promise<Deployment>;
        }),
    ]);

    return clusterDescriptions.map((description) => {
      return buildConnectionInfoFromClusterDescription(
        this.atlasService.driverProxyEndpoint(),
        this.orgId,
        this.projectId,
        description,
        deployment
      );
    });
  }

  loadAll(): Promise<ConnectionInfo[]> {
    return (this.loadAllPromise ??=
      this._loadAndNormalizeClusterDescriptionInfo());
  }
}

const SandboxConnectionStorageContext =
  React.createContext<ConnectionStorage | null>(null);

/**
 * Only used in the sandbox to provide connection info when connecting to the
 * non-Atlas deployment
 * @internal
 */
export const SandboxConnectionStorageProviver =
  SandboxConnectionStorageContext.Provider;

export const AtlasCloudConnectionStorageProvider = createServiceProvider(
  function AtlasCloudConnectionStorageProvider({
    orgId,
    projectId,
    children,
  }: {
    orgId: string;
    projectId: string;
    children: React.ReactChild;
  }) {
    const atlasService = atlasServiceLocator();
    const storage = useRef(
      new AtlasCloudConnectionStorage(atlasService, orgId, projectId)
    );
    const sandboxConnectionStorage = useContext(
      SandboxConnectionStorageContext
    );
    return (
      <ConnectionStorageProvider
        value={sandboxConnectionStorage ?? storage.current}
      >
        {children}
      </ConnectionStorageProvider>
    );
  }
);
