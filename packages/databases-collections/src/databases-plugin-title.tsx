import React from 'react';
import { useTabConnectionTheme } from '@mongodb-js/compass-connections/provider';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';

import { DatabasesWorkspaceName } from './databases-plugin';

// TODO: get these somewhere shared.
type Tooltip = [string, string][];

export function DatabasesPluginTitle() {
  return ({
    id,
    connectionId,
  }: {
    // TODO: Standardize this type/import from somewhere?
    id: string;
    connectionId: string;
  }) => {
    const { getConnectionById } = useConnectionsListRef();
    const { getThemeOf } = useTabConnectionTheme();

    const connectionName = getConnectionById(connectionId)?.title || '';
    return {
      id,
      connectionName,
      type: DatabasesWorkspaceName,
      title: connectionName,
      tooltip: [['Connection', connectionName || '']] as Tooltip,
      iconGlyph: 'Server',
      tabTheme: getThemeOf(connectionId),
    } as const;
  };
}
