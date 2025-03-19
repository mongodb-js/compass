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
  const name = encodeURIComponent(clusterName);
  const type = encodeURIComponent(metricsType);
  const id = encodeURIComponent(metricsId);

  if (metricsType === 'serverless' || metricsType === 'flex') {
    return `#/${type}/advisor/${name}/createIndexes`;
  }

  return `#/metrics/${type}/${id}/advisor`;
}
