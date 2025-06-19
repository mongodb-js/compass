import React from 'react';
import {
  useConnectionInfo,
  useConnectionsListRef,
  useTabConnectionTheme,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { WorkspacePluginProps } from '@mongodb-js/compass-workspaces';

import { CollectionsWorkspaceName } from './collections-plugin';

type PluginTitleProps = WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof CollectionsWorkspaceName>;

export function CollectionsPluginTitleComponent(props: PluginTitleProps) {
  const { id: connectionId } = useConnectionInfo();
  const { getConnectionById } = useConnectionsListRef();
  const { getThemeOf } = useTabConnectionTheme();

  const connectionName = getConnectionById(connectionId)?.title || '';
  const database = props.namespace;

  return (
    <WorkspaceTab
      {...props}
      connectionName={connectionName}
      type={CollectionsWorkspaceName}
      title={database}
      tooltip={[
        ['Connection', connectionName || ''],
        ['Database', database],
      ]}
      iconGlyph={props.isNonExistent ? 'EmptyDatabase' : 'Database'}
      data-namespace={props.namespace}
      tabTheme={getThemeOf(connectionId)}
      isNonExistent={props.isNonExistent}
    />
  );
}
