import React from 'react';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Agent' as const;

type PluginTitleProps = PluginHeaderProps<typeof WorkspaceName>;

export function AgentPluginTitleComponent(tabProps: PluginTitleProps) {
  const { getConnectionById } = useConnectionsListRef();
  const { id: connectionId } = useConnectionInfo();

  const connectionName = getConnectionById(connectionId)?.title || '';
  return (
    <WorkspaceTab
      {...tabProps}
      connectionName={connectionName}
      type={WorkspaceName}
      title={connectionName ? `AI Agent: ${connectionName}` : 'AI Agent'}
      tooltip={connectionName ? [['AI Agent', connectionName]] : []}
      iconGlyph="Sparkle"
    />
  );
}
