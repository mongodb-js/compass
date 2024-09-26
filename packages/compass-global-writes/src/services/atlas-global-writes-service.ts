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
}
