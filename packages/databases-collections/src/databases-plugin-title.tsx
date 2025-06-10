import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import {
  useTabConnectionTheme,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';

import { DatabasesWorkspaceName } from './databases-plugin';

type WorkspaceProps = {
  id: string;
  connectionId: string;
};

export function DatabasesPluginTitle(workspaceProps: WorkspaceProps) {
  return (tabProps: WorkspaceTabCoreProps) => {
    const { getConnectionById } = useConnectionsListRef();
    const { getThemeOf } = useTabConnectionTheme();

    const connectionName =
      getConnectionById(workspaceProps.connectionId)?.title || '';
    return (
      <WorkspaceTab
        connectionName={connectionName}
        {...tabProps}
        id={workspaceProps.id}
        type={DatabasesWorkspaceName}
        title={connectionName}
        tooltip={[['Connection', connectionName || '']]}
        iconGlyph="Server"
        tabTheme={getThemeOf(workspaceProps.connectionId)}
      />
    );
  };
}
