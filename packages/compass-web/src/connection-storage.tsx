import React, { useContext, useEffect, useRef } from 'react';
import type {
  ConnectionStorage,
  ConnectionInfo,
} from '@mongodb-js/connection-storage/provider';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
  ConnectionStorageEvents,
} from '@mongodb-js/connection-storage/provider';
import ConnectionString from 'mongodb-connection-string-url';
import { createServiceProvider } from 'hadron-app-registry';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';

type ClusterDescription = {
  '@provider': string;
  uniqueId: string;
  groupId: string;
  name: string;
  clusterType: string;
  srvAddress: string;
  state: string;
  deploymentItemName: string;
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
    id: description.uniqueId,
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
    },
  };
}

class AtlasCloudConnectionStorage
  extends InMemoryConnectionStorage
  implements ConnectionStorage
{
  private pollingInterval: ReturnType<typeof setInterval> | undefined;
  private loadAllPromise: Promise<ConnectionInfo[]> | undefined;
  constructor(
    private atlasService: AtlasService,
    private orgId: string,
    private projectId: string,
    private autoConnectConnectionId: string | undefined,
    private __sandboxAutoconnectInfo: ConnectionInfo | null = null
  ) {
    super();
  }
  async getAutoConnectInfo(): Promise<ConnectionInfo | undefined> {
    if (this.__sandboxAutoconnectInfo) {
      return Promise.resolve(this.__sandboxAutoconnectInfo);
    }
    if (!this.autoConnectConnectionId) {
      return Promise.resolve(undefined);
    }
    return this.load({ id: this.autoConnectConnectionId });
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
            descriptions.map((description) => {
              return this.atlasService
                .authenticatedFetch(
                  this.atlasService.cloudEndpoint(
                    `nds/clusters/${this.projectId}/${description.name}/regional/clusterDescription`
                  )
                )
                .then((res) => {
                  return res.json() as Promise<ClusterDescriptionWithDataProcessingRegion>;
                });
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
    if (this.__sandboxAutoconnectInfo) {
      return Promise.resolve([this.__sandboxAutoconnectInfo]);
    }
    return (this.loadAllPromise ??=
      this._loadAndNormalizeClusterDescriptionInfo());
  }

  startPolling() {
    clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      delete this.loadAllPromise;
      void this.loadAll().then(() => {
        this.emit(ConnectionStorageEvents.ConnectionsChanged);
      });
    }, /* Matches default polling intervals in mms codebase */ 60_000);
    return () => {
      clearInterval(this.pollingInterval);
    };
  }
}

const SandboxAutoconnectContext = React.createContext<ConnectionInfo | null>(
  null
);

/**
 * Only used in the sandbox to provide connection info when connecting to the
 * non-Atlas deployment
 * @internal
 */
export const SandboxAutoconnectProvider = SandboxAutoconnectContext.Provider;

export const AtlasCloudConnectionStorageProvider = createServiceProvider(
  function AtlasCloudConnectionStorageProvider({
    orgId,
    projectId,
    autoConnectConnectionId,
    children,
  }: {
    orgId: string;
    projectId: string;
    autoConnectConnectionId?: string;
    children: React.ReactChild;
  }) {
    const atlasService = atlasServiceLocator();
    const sandboxAutoconnectInfo = useContext(SandboxAutoconnectContext);
    const storage = useRef(
      new AtlasCloudConnectionStorage(
        atlasService,
        orgId,
        projectId,
        autoConnectConnectionId,
        sandboxAutoconnectInfo
      )
    );
    useEffect(() => {
      return storage.current.startPolling();
    }, []);
    return (
      <ConnectionStorageProvider value={storage.current}>
        {children}
      </ConnectionStorageProvider>
    );
  }
);
