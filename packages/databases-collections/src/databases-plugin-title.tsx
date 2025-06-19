import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import {
  useConnectionInfo,
  useConnectionsListRef,
  useTabConnectionTheme,
} from '@mongodb-js/compass-connections/provider';
import type { WorkspacePluginProps } from '@mongodb-js/compass-workspaces';

import { DatabasesWorkspaceName } from './databases-plugin';

type PluginTitleProps = WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof DatabasesWorkspaceName>;

export function DatabasesPluginTitleComponent(props: PluginTitleProps) {
  const { id: connectionId } = useConnectionInfo();
  const { getConnectionById } = useConnectionsListRef();
  const { getThemeOf } = useTabConnectionTheme();

  const connectionName = getConnectionById(connectionId)?.title || '';
  return (
    <WorkspaceTab
      {...props}
      connectionName={connectionName}
      type={DatabasesWorkspaceName}
      title={connectionName}
      tooltip={[['Connection', connectionName || '']]}
      iconGlyph="Server"
      tabTheme={getThemeOf(connectionId)}
    />
  );
}
