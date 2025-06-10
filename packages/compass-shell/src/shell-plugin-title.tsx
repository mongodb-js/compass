import React from 'react';
import { useTabConnectionTheme } from '@mongodb-js/compass-connections/provider';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';

// TODO: get these somewhere shared.
type Tooltip = [string, string][];

export const WorkspaceName = 'Shell' as const;

export function ShellPluginTitle() {
  return (tabProps: {
    id: string;
    connectionId: string;
    // initialEvaluate?: string | string[];
    // initialInput?: string;
    // type: typeof WorkspaceName;
  }) => {
    // TODO: We need these in the react life cycle.
    const { getThemeOf } = useTabConnectionTheme();
    const { getConnectionById } = useConnectionsListRef();

    const connectionName =
      getConnectionById(tabProps.connectionId)?.title || '';
    const tooltip: Tooltip = [];
    if (connectionName) {
      tooltip.push(['mongosh', connectionName || '']);
    }
    return {
      id: tabProps.id,
      connectionName,
      type: WorkspaceName,
      title: connectionName ? `mongosh: ${connectionName}` : 'MongoDB Shell',
      tooltip,
      iconGlyph: 'Shell' as const,
      tabTheme: getThemeOf(tabProps.connectionId),
    };
  };
}
