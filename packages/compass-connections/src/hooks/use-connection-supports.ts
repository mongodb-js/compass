import type { ConnectionState } from '../stores/connections-store-redux';
import { useConnectionForId } from '../stores/store-context';

export function isFreeOrSharedTierCluster(
  instanceSize: string | undefined
): boolean {
  if (!instanceSize) {
    return false;
  }

  return ['M0', 'M2', 'M5'].includes(instanceSize);
}

// only one for now
type ConnectionFeature = 'rollingIndexCreation';

function supportsRollingIndexCreation(connection: ConnectionState) {
  const atlasMetadata = connection.info?.atlasMetadata;

  if (!atlasMetadata) {
    return false;
  }

  const { clusterType, instanceSize } = atlasMetadata;
  return (
    !isFreeOrSharedTierCluster(instanceSize) &&
    (clusterType === 'cluster' || clusterType === 'replicaSet')
  );
}

export function useConnectionSupports(
  connectionId: string,
  connectionFeature: ConnectionFeature
): boolean {
  const connection = useConnectionForId(connectionId);

  if (!connection) {
    return false;
  }

  if (connectionFeature === 'rollingIndexCreation') {
    return supportsRollingIndexCreation(connection);
  }

  return false;
}
