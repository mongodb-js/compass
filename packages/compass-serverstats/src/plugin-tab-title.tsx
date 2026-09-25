import React from 'react';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Performance' as const;

type PluginTitleComponentProps = PluginHeaderProps<typeof WorkspaceName>;

export function ServerStatsPluginTitleComponent(
  props: PluginTitleComponentProps
) {
  const { getConnectionById } = useConnectionsListRef();
  const { id: connectionId } = useConnectionInfo();
  const connectionName = getConnectionById(connectionId)?.title || '';

  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      connectionName={connectionName}
      title={`Performance: ${connectionName}`}
      tooltip={[['Performance', connectionName || '']]}
      iconGlyph="Gauge"
    />
  );
}
