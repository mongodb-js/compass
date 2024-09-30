import toNS from 'mongodb-ns';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import type { CreateShardKeyData } from '../store/reducer';

type ZoneMapping = unknown;
export type ManagedNamespace = {
  db: string;
  collection: string;
  customShardKey: string;
  isCustomShardKeyHashed: boolean;
  isShardKeyUnique: boolean;
  numInitialChunks: number | null;
  presplitHashedZones: boolean;
};

type GeoShardingData = {
  customZoneMapping: Record<string, ZoneMapping>;
  managedNamespaces: ManagedNamespace[];
  selfManagedSharding: boolean;
};

type ClusterDetailsApiResponse = {
  geoSharding: GeoShardingData;
};

type AutomationProcessStatus = {
  cluster: string;
  processType: '';
  statusType: 'ERROR' | string;
  workingOnShort: 'ShardCollections' | string;
  errorText: string;
};

type DeploymentStatusApiResponse = {
  automationStatus: {
    processes: AutomationProcessStatus[];
  };
};

type AtlasCluterInfo = {
  projectId: string;
  clusterName: string;
};

function assertDataIsClusterDetailsApiResponse(
  data: any
): asserts data is ClusterDetailsApiResponse {
  if (!Array.isArray(data?.geoSharding?.managedNamespaces)) {
    throw new Error(
      'Invalid cluster details API response geoSharding.managedNamespaces'
    );
  }
  if (typeof data?.geoSharding?.customZoneMapping !== 'object') {
    throw new Error(
      'Invalid cluster details API response geoSharding.customZoneMapping'
    );
  }
}

function assertDataIsDeploymentStatusApiResponse(
  data: any
): asserts data is DeploymentStatusApiResponse {
  if (!Array.isArray(data?.automationStatus?.processes)) {
    throw new Error('Invalid deployment status API response');
  }
}

export class AtlasGlobalWritesService {
  constructor(private atlasService: AtlasService) {}

  private async fetchClusterDetails({
    clusterName,
    projectId,
  }: AtlasCluterInfo): Promise<ClusterDetailsApiResponse> {
    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${projectId}/${clusterName}`
    );
    const response = await this.atlasService.authenticatedFetch(uri);
    const clusterDetails = await response.json();
    assertDataIsClusterDetailsApiResponse(clusterDetails);
    return clusterDetails;
  }

  async isNamespaceManaged(
    namespace: string,
    atlasClusterInfo: AtlasCluterInfo
  ) {
    const clusterDetails = await this.fetchClusterDetails(atlasClusterInfo);
    const { database, collection } = toNS(namespace);
    return clusterDetails.geoSharding.managedNamespaces.some(
      (managedNamespace) => {
        return (
          managedNamespace.db === database &&
          managedNamespace.collection === collection
        );
      }
    );
  }

  async createShardKey(
    namespace: string,
    keyData: CreateShardKeyData,
    atlasClusterInfo: AtlasCluterInfo
  ) {
    const clusterDetails = await this.fetchClusterDetails(atlasClusterInfo);
    const { database, collection } = toNS(namespace);
    const requestData: GeoShardingData = {
      ...clusterDetails.geoSharding,
      managedNamespaces: [
        ...clusterDetails.geoSharding.managedNamespaces,
        {
          db: database,
          collection: collection,
          ...keyData,
        },
      ],
    };

    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${atlasClusterInfo.projectId}/${atlasClusterInfo.clusterName}/geoSharding`
    );

    await this.atlasService.authenticatedFetch(uri, {
      method: 'PATCH',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getShardingError(
    namespace: string,
    { projectId, clusterName }: AtlasCluterInfo
  ) {
    const { database, collection } = toNS(namespace);
    const uri = this.atlasService.cloudEndpoint(
      `automation/deploymentStatus/${projectId}`
    );
    const response = await this.atlasService.authenticatedFetch(uri);
    const deploymentStatus = await response.json();
    assertDataIsDeploymentStatusApiResponse(deploymentStatus);
    const error = deploymentStatus.automationStatus.processes.find(
      (status) =>
        status.cluster === clusterName &&
        status.statusType === 'ERROR' &&
        status.workingOnShort === 'ShardCollections' &&
        status.errorText.indexOf(`${database}.${collection}`) > -1
    )?.errorText;
    return error;
  }
}
