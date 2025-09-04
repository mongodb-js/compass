import { useConnectionIds } from '@mongodb-js/compass-connections/provider';
import { getGenuineMongoDB } from 'mongodb-build-info';
import React from 'react';
import { CompassAssistantDrawer } from '@mongodb-js/compass-assistant';

// TODO(COMPASS-7830): This is a temporary solution to pass the
// hasNonGenuineConnections prop to the CompassAssistantDrawer as otherwise
// we end up with a circular dependency.
export function CompassAssistantDrawerWithConnections() {
  // Check for non-genuine connections
  const activeConnectionIds = useConnectionIds(
    (conn) =>
      getGenuineMongoDB(conn.info.connectionOptions.connectionString)
        .isGenuine === false && conn.status === 'connected'
  );
  return (
    <CompassAssistantDrawer
      hasNonGenuineConnections={activeConnectionIds.length > 0}
    />
  );
}
