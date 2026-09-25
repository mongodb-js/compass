import React from 'react';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

import { CollectionsWorkspaceName } from './collections-plugin';

type PluginTitleProps = PluginHeaderProps<typeof CollectionsWorkspaceName>;

export function CollectionsPluginTitleComponent({
  namespace: database,
  inferredFromPrivileges,
  ...tabProps
}: PluginTitleProps) {
  const { id: connectionId } = useConnectionInfo();
  const { getConnectionById } = useConnectionsListRef();

  const connectionName = getConnectionById(connectionId)?.title || '';

  return (
    <WorkspaceTab
      {...tabProps}
      connectionName={connectionName}
      type={CollectionsWorkspaceName}
      title={database}
      tooltip={[
        ['Connection', connectionName || ''],
        ['Database', database],
      ]}
      iconGlyph={inferredFromPrivileges ? 'EmptyDatabase' : 'Database'}
      data-namespace={database}
      inferredFromPrivileges={inferredFromPrivileges}
    />
  );
}
