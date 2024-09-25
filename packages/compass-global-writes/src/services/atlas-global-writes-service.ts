import type { AtlasService } from '@mongodb-js/atlas-service/provider';

export class AtlasGlobalWritesService {
  constructor(private atlasService: AtlasService) {}

  async isNamespaceManaged(
    namespace: string,
    {
      clusterName,
      orgId,
    }: {
      orgId: string;
      clusterName: string;
    }
  ) {
    const uri = this.atlasService.cloudEndpoint(
      `nds/clusters/${orgId}/${clusterName}`
    );
    const response = await this.atlasService.authenticatedFetch(uri);
    const cluster = await response.json();
    console.log(cluster, namespace);

    return false;
  }
}
