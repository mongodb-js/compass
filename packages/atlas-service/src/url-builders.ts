import toNS from 'mongodb-ns';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';

export function buildPerformanceMetricsUrl({
  projectId,
  metricsType,
  metricsId,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  return `${url}#/host/${metricsType}/${metricsId}/realtime/panel`;
}

export function buildMonitoringUrl({
  projectId,
  metricsType,
  metricsId,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  return `${url}#/host/${metricsType}/${metricsId}`;
}

export function buildClusterOverviewUrl({
  projectId,
  clusterName,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
  return `${url}#/clusters/detail/${clusterName}`;
}

export function buildQueryInsightsUrl({
  projectId,
  metricsType,
  metricsId,
}: AtlasClusterMetadata): string {
  const url = new URL(`/v2/${projectId}`, window.location.origin);
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
