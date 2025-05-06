import type { ConnectionInfo } from '@mongodb-js/connection-info';
export type ConnectionFeature = 'rollingIndexCreation' | 'globalWrites';

function supportsRollingIndexCreation(connectionInfo: ConnectionInfo) {
  const atlasMetadata = connectionInfo.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  return atlasMetadata.supports.rollingIndexes;
}

export function connectable(connectionInfo: ConnectionInfo) {
  const atlasClusterState = connectionInfo.atlasMetadata?.clusterState;
  if (
    atlasClusterState === 'DELETED' ||
    atlasClusterState === 'DELETING' ||
    atlasClusterState === 'CREATING' ||
    atlasClusterState === 'PAUSED'
  ) {
    return false;
  }
  return true;
}

function supportsGlobalWrites(connectionInfo: ConnectionInfo) {
  const atlasMetadata = connectionInfo.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  return atlasMetadata.supports.globalWrites;
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
