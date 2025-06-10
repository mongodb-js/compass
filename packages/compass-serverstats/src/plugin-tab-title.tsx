import React from 'react';
import {
  useTabConnectionTheme,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';

// TODO: Use from a shared place.
type Tooltip = [string, string][];

export const PerformanceWorkspaceName = 'Performance' as const;

export function ServerStatsPluginTitle() {
  return (tab: {
    // TODO: Standardize this type.
    id: string;
    // namespace: string;
    // databaseInfo: Record<string, { isNonExistent: boolean }>;
    connectionId: string;
    // initialEvaluate?: string | string[];
    // initialInput?: string;
    // type: typeof WorkspaceName;
  }) => {
    const { getConnectionById } = useConnectionsListRef();
    const { getThemeOf } = useTabConnectionTheme();

    const connectionName = getConnectionById(tab.connectionId)?.title || '';
    return {
      id: tab.id,
      connectionName,
      type: PerformanceWorkspaceName,
      title: `Performance: ${connectionName}`,
      tooltip: [['Performance', connectionName || '']] as Tooltip,
      iconGlyph: 'Gauge',
      tabTheme: getThemeOf(tab.connectionId),
    } as const;
  };
}
