import React from 'react';
import {
  useTabConnectionTheme,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';

export const WorkspaceName = 'Performance' as const;

export function ServerStatsPluginTitleComponent({
  tabProps,
  workspaceProps,
}: {
  tabProps: WorkspaceTabCoreProps;
  workspaceProps: {
    id: string;
    connectionId: string;
  };
}) {
  const { getConnectionById } = useConnectionsListRef();
  const connectionName =
    getConnectionById(workspaceProps.connectionId)?.title || '';

  const { getThemeOf } = useTabConnectionTheme();

  return (
    <WorkspaceTab
      {...tabProps}
      id={workspaceProps.id}
      type={WorkspaceName}
      connectionName={connectionName}
      title={`Performance: ${connectionName}`}
      tooltip={[['Performance', connectionName || '']]}
      iconGlyph="Gauge"
      tabTheme={getThemeOf(workspaceProps.connectionId)}
    />
  );
}
