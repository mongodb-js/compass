import type { AtlasService } from '@mongodb-js/atlas-service/provider';

export type AtlasConnectionDebugResult = {
  clusterState: 'ready' | 'paused' | 'provisioning' | 'deleted' | 'notFound';
  ipAccessAllowed: boolean;
};

export async function debugConnection(
  _connectionString: string,
  _atlasService: AtlasService
): Promise<AtlasConnectionDebugResult> {
  // TODO(COMPASS-10826): implement
  return await Promise.resolve({
    clusterState: 'paused',
    ipAccessAllowed: true,
  });
}
