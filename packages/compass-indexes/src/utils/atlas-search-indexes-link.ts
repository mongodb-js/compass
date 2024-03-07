import type { AtlasClusterMetadata } from '@mongodb-js/connection-storage/renderer';

export function getAtlasSearchIndexesLink({
  clusterName,
}: Pick<AtlasClusterMetadata, 'clusterName'>) {
  return `#/clusters/atlasSearch/${clusterName}`;
}
