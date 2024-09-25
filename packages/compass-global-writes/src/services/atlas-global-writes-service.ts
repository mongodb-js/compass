import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import toNS from 'mongodb-ns';

export type ManagedNamespace = {
  db: string;
  collection: string;
  customShardKey: string;
  isCustomShardKeyHashed: boolean;
  isShardKeyUnique: boolean;
  numInitialChunks?: number;
  presplitHashedZones: boolean;
};

type ClusterDetailsApiResponse = {
  geoSharding: {
    customZoneMapping: unknown;
    managedNamespaces: ManagedNamespace[];
  };
};

function assertDataIsClusterDetailsApiResponse(
  data: any
): asserts data is ClusterDetailsApiResponse {
  if (!Array.isArray(data?.geoSharding?.managedNamespaces)) {
    throw new Error('Invalid cluster details API response');
  }
}

export class AtlasGlobalWritesService {
  constructor(private atlasService: AtlasService) {}

  async isNamespaceManaged(
    namespace: string,
    {
      clusterName,
      projectId,
    }: {
      projectId: string;
      clusterName: string;
    }
  ) {
    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${projectId}/${clusterName}`
    );
    const response = await this.atlasService.authenticatedFetch(uri);
    const cluster = await response.json();

    assertDataIsClusterDetailsApiResponse(cluster);

    const { database, collection } = toNS(namespace);
    return cluster.geoSharding.managedNamespaces.some((managedNamespace) => {
      return (
        managedNamespace.db === database &&
        managedNamespace.collection === collection
      );
    });
  }
}
