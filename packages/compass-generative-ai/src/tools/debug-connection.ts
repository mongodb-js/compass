import type { AtlasAdminApiService } from '@mongodb-js/atlas-admin-api/provider';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';

export type AtlasConnectionDebugResult = {
  cluster: string;
  clusterState: 'ready' | 'paused' | 'provisioning' | 'deleted' | 'notFound';
  ipAccessAllowed: 'Allowed' | 'NotAllowed';
};

export async function debugConnection(
  _connectionString: string,
  _atlasAdminApi: AtlasAdminApiService,
  _authService: AtlasAuthService
): Promise<AtlasConnectionDebugResult> {
  // TODO(COMPASS-10826): implement
  return await Promise.resolve({
    cluster: 'Cluster0',
    clusterState: 'paused',
    ipAccessAllowed: 'Allowed',
  });
}
