import type { AtlasClusterMetadata } from '@mongodb-js/connection-storage/renderer';

export function getAtlasPerformanceAdvisorLink({
  metricsId,
  metricsType,
  clusterName,
}: Pick<AtlasClusterMetadata, 'metricsId' | 'metricsType' | 'clusterName'>) {
  if (metricsType === 'serverless') {
    return `#/serverless/advisor/${encodeURIComponent(
      clusterName
    )}/createIndexes`;
  }
  return `#/metrics/${encodeURIComponent(metricsType)}/${encodeURIComponent(
    metricsId
  )}/advisor`;
}
