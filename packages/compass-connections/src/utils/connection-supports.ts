import type { ConnectionInfo } from '@mongodb-js/connection-info';
export type ConnectionFeature = 'rollingIndexCreation' | 'globalWrites';

function isFreeOrSharedTierCluster(instanceSize: string | undefined): boolean {
  if (!instanceSize) {
    return false;
  }

  return ['M0', 'M2', 'M5'].includes(instanceSize);
}

function supportsRollingIndexCreation(connectionInfo: ConnectionInfo) {
  const atlasMetadata = connectionInfo.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  const { metricsType, instanceSize } = atlasMetadata;
  return (
    (metricsType === 'cluster' || metricsType === 'replicaSet') &&
    !isFreeOrSharedTierCluster(instanceSize)
  );
}

function supportsGlobalWrites(connectionInfo: ConnectionInfo) {
  const atlasMetadata = connectionInfo.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  return (
    atlasMetadata.clusterType === 'GEOSHARDED' &&
    !atlasMetadata.geoSharding?.selfManagedSharding
  );
}

export function connectionSupports(
  connectionInfo: ConnectionInfo,
  connectionFeature: ConnectionFeature
): boolean {
  if (connectionFeature === 'rollingIndexCreation') {
    return supportsRollingIndexCreation(connectionInfo);
  }

  if (connectionFeature === 'globalWrites') {
    return supportsGlobalWrites(connectionInfo);
  }

  return false;
}
