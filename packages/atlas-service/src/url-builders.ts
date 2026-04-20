import toNS from 'mongodb-ns';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';

export function buildPerformanceMetricsUrl({
  projectId,
  clusterName,
  metricsType,
  metricsId,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  if (metricsType === 'flex') {
    return `${url}#/flex/realtime/${clusterName}`;
  }
  return `${url}#/host/${metricsType}/${metricsId}/realtime/panel`;
}

export function buildProjectSettingsUrl({
  projectId,
}: Pick<AtlasClusterMetadata, 'projectId'>): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  return `${url}#/settings/groupSettings`;
}

export function buildMonitoringUrl({
  projectId,
  clusterName,
  metricsType,
  metricsId,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  if (metricsType === 'flex') {
    return `${url}#/flex/monitoring/${clusterName}`;
  }
  return `${url}#/host/${metricsType}/${metricsId}`;
}

export function buildClusterOverviewUrl({
  projectId,
  clusterName,
  metricsType,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  if (metricsType === 'flex') {
    return `${url}#/flex/detail/${clusterName}`;
  }
  return `${url}#/clusters/detail/${clusterName}`;
}

export function buildQueryInsightsUrl({
  projectId,
  clusterName,
  metricsType,
  metricsId,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  if (metricsType === 'flex') {
    return `${url}#/flex/queryInsights/${clusterName}`;
  }
  return `${url}#/metrics/${metricsType}/${metricsId}/queryInsights/shape`;
}

export function buildChartsUrl(
  { projectId, clusterName }: AtlasClusterMetadata,
  namespace?: string
): string {
  const { database } = toNS(namespace ?? '');
  const url = new URL(`/charts/${projectId}`, window.location.origin);
  url.searchParams.set('sourceType', 'cluster');
  url.searchParams.set('name', clusterName);
  if (database) {
    url.searchParams.set('database', database);
  }
  return `${url}`;
}

export function buildAtlasSearchLink({
  atlasMetadata,
  namespace,
  indexName,
  view,
}: {
  atlasMetadata: AtlasClusterMetadata;
  namespace: string;
  indexName?: string;
  view?: string;
}): string {
  const { projectId, clusterName } = atlasMetadata;
  const hashParams = new URLSearchParams();
  const { database, collection } = toNS(namespace);
  if (database && collection) {
    hashParams.set('collectionName', collection);
    hashParams.set('database', database);
    if (indexName) {
      hashParams.set('indexName', indexName);
      if (view) {
        hashParams.set('view', view);
      }
    }
  }
  const hashQuery = hashParams.toString();
  const hash = `/clusters/atlasSearch/${clusterName}${
    hashQuery ? `?${hashQuery}` : ''
  }`;
  return `${window.location.origin}/v2/${projectId}#${hash}`;
}
