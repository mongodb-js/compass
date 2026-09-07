import React from 'react';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Shell' as const;

type PluginTitleProps = PluginHeaderProps<typeof WorkspaceName>;

export function ShellPluginTitleComponent(tabProps: PluginTitleProps) {
  const { getConnectionById } = useConnectionsListRef();
  const { id: connectionId } = useConnectionInfo();

  const connectionName = getConnectionById(connectionId)?.title || '';
  return (
    <WorkspaceTab
      {...tabProps}
      connectionName={connectionName}
      type={WorkspaceName}
      title={connectionName ? `mongosh: ${connectionName}` : 'MongoDB Shell'}
      tooltip={connectionName ? [['mongosh', connectionName]] : []}
      iconGlyph="Shell"
    />
  );
}
