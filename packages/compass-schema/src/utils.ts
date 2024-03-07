import type { AtlasClusterMetadata } from '@mongodb-js/connection-storage/renderer';

export function getAtlasPerformanceAdvisorLink({
  clusterId,
  clusterType,
  clusterName,
}: Pick<AtlasClusterMetadata, 'clusterId' | 'clusterType' | 'clusterName'>) {
  if (clusterType === 'serverless') {
    return `#/serverless/advisor/${clusterName}/createIndexes`;
  }
  return `#/metrics/${clusterType}/${clusterId}/advisor`;
}
