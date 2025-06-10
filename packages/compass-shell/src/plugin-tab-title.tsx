import React from 'react';
import {
  useConnectionsListRef,
  useTabConnectionTheme,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';

export const WorkspaceName = 'Shell' as const;

export function ShellPluginTitle(workspaceProps: {
  id: string;
  connectionId: string;
}) {
  return (tabProps: WorkspaceTabCoreProps) => {
    const { getThemeOf } = useTabConnectionTheme();
    const { getConnectionById } = useConnectionsListRef();

    const connectionName =
      getConnectionById(workspaceProps.connectionId)?.title || '';
    return (
      <WorkspaceTab
        {...tabProps}
        id={workspaceProps.id}
        connectionName={connectionName}
        type={WorkspaceName}
        title={connectionName ? `mongosh: ${connectionName}` : 'MongoDB Shell'}
        tooltip={connectionName ? [['mongosh', connectionName]] : []}
        iconGlyph="Shell"
        tabTheme={getThemeOf(workspaceProps.connectionId)}
      />
    );
  };
}
