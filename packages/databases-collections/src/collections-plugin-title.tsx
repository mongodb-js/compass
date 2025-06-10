import React from 'react';
import { useTabConnectionTheme } from '@mongodb-js/compass-connections/provider';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';
import {
  css,
  palette,
  type WorkspaceTabComponentProps,
} from '@mongodb-js/compass-components';

import { CollectionsWorkspaceName } from './collections-plugin';

// TODO: get these somewhere shared.
type Tooltip = [string, string][];
const nonExistentStyles = css({
  color: palette.gray.base,
});

export function CollectionsPluginTitle() {
  return (tabProps: {
    // TODO: Standardize this type.
    id: string;
    namespace: string;
    databaseInfo: Record<string, { isNonExistent: boolean }>; // TODO: This should be something the plugin handles.
    connectionId: string;
    // initialEvaluate?: string | string[];
    // initialInput?: string;
    // type: typeof WorkspaceName;
  }): WorkspaceTabComponentProps => {
    const { getConnectionById } = useConnectionsListRef();
    const { getThemeOf } = useTabConnectionTheme();

    const connectionName =
      getConnectionById(tabProps.connectionId)?.title || '';
    const database = tabProps.namespace;
    const namespaceId = `${tabProps.connectionId}.${database}`;
    const { isNonExistent } = tabProps.databaseInfo[namespaceId] ?? {};
    return {
      id: tabProps.id,
      connectionName,
      type: CollectionsWorkspaceName,
      title: database,
      tooltip: [
        ['Connection', connectionName || ''],
        ['Database', database],
      ] as Tooltip,
      iconGlyph: isNonExistent ? 'EmptyDatabase' : 'Database',
      'data-namespace': tabProps.namespace,
      tabTheme: getThemeOf(tabProps.connectionId),
      ...(isNonExistent && {
        className: nonExistentStyles,
      }),
    } as const;
  };
}
