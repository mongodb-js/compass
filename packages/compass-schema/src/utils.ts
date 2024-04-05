import type { AtlasClusterMetadata } from '@mongodb-js/connection-storage/renderer';

export function getAtlasPerformanceAdvisorLink({
  clusterId,
  clusterType,
  clusterName,
}: Pick<AtlasClusterMetadata, 'clusterId' | 'clusterType' | 'clusterName'>) {
  if (clusterType === 'serverless') {
    return `#/serverless/advisor/${encodeURIComponent(
      clusterName
    )}/createIndexes`;
  }
  return `#/metrics/${encodeURIComponent(clusterType)}/${encodeURIComponent(
    clusterId
  )}/advisor`;
}
