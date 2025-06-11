import React from 'react';
import {
  useTabConnectionTheme,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';

import { CollectionsWorkspaceName } from './collections-plugin';

type WorkspaceProps = {
  id: string;
  namespace: string;
  connectionId: string;
  isNonExistent: boolean;
};

export function CollectionsPluginTitleComponent({
  tabProps,
  workspaceProps,
}: {
  tabProps: WorkspaceTabCoreProps;
  workspaceProps: WorkspaceProps;
}) {
  const { getConnectionById } = useConnectionsListRef();
  const { getThemeOf } = useTabConnectionTheme();

  const connectionName =
    getConnectionById(workspaceProps.connectionId)?.title || '';
  const database = workspaceProps.namespace;

  return (
    <WorkspaceTab
      {...tabProps}
      id={workspaceProps.id}
      connectionName={connectionName}
      type={CollectionsWorkspaceName}
      title={database}
      tooltip={[
        ['Connection', connectionName || ''],
        ['Database', database],
      ]}
      iconGlyph={workspaceProps.isNonExistent ? 'EmptyDatabase' : 'Database'}
      data-namespace={workspaceProps.namespace}
      tabTheme={getThemeOf(workspaceProps.connectionId)}
      isNonExistent={workspaceProps.isNonExistent}
    />
  );
}
