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

function getPreferredRegion(
  replicationSpec: ReplicationSpec
): RegionConfig | undefined {
  let regionConfig: RegionConfig | undefined = undefined;

  // find the RegionConfig in replicationSpec with the highest priority
  for (const r of replicationSpec.regionConfigs) {
    if (!regionConfig || r.priority > regionConfig.priority) {
      regionConfig = r;
    }
  }

  return regionConfig;
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
      ...getMetricsIdAndType(description, deploymentItem),
      instanceSize: getInstanceSize(description),
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
