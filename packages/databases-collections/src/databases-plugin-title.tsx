import React from 'react';
import { WorkspaceTab, useTranslation } from '@mongodb-js/compass-components';
import {
  useConnectionInfo,
  useConnectionsListRef,
} from '@mongodb-js/compass-connections/provider';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

import { DatabasesWorkspaceName } from './databases-plugin';

type PluginTitleProps = PluginHeaderProps<typeof DatabasesWorkspaceName>;

export function DatabasesPluginTitleComponent(props: PluginTitleProps) {
  const t = useTranslation();
  const { id: connectionId } = useConnectionInfo();
  const { getConnectionById } = useConnectionsListRef();

  const connectionName = getConnectionById(connectionId)?.title || '';
  return (
    <WorkspaceTab
      {...props}
      connectionName={connectionName}
      type={DatabasesWorkspaceName}
      title={connectionName}
      tooltip={[
        [
          t('databasesCollections.tab.connection', 'Connection'),
          connectionName,
        ],
      ]}
      iconGlyph="Server"
    />
  );
}
