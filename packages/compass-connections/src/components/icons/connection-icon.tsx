import React from 'react';
import type {
  ConnectionInfo,
  ConnectionStatus,
} from '@mongodb-js/connection-info';
import { WithStatusMarker } from './with-status-marker';
import { Icon, ServerIcon } from '@mongodb-js/compass-components';
import { isLocalhost } from 'mongodb-build-info';

export function ConnectionIcon({
  connectionInfo,
  withStatus,
}: {
  connectionInfo: ConnectionInfo;
  withStatus?: ConnectionStatus;
}): React.ReactElement {
  const isFavorite = connectionInfo.savedConnectionType === 'favorite';
  let icon: React.ReactElement = <ServerIcon />;
  if (isFavorite) {
    icon = <Icon glyph="Favorite" />;
  }
  if (isLocalhost(connectionInfo.connectionOptions.connectionString)) {
    icon = <Icon glyph="Laptop" />;
  }
  if (withStatus) {
    return <WithStatusMarker status={withStatus}>{icon}</WithStatusMarker>;
  }
  return icon;
}
