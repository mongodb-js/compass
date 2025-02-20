import type { AtlasClusterMetadata } from '@mongodb-js/connection-storage/renderer';
import type { AnyAction } from 'redux';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

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
