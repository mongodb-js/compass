import React, { useMemo } from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import { useActiveConnections } from '@mongodb-js/compass-connections/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import type { WorkspacePluginProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'My Queries' as const;

type PluginTabTitleProps = WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTabTitleProps) {
  const activeConnections = useActiveConnections();

  const { tooltip, connectionName } = useMemo(() => {
    const titles = activeConnections
      .map((c) => getConnectionTitle(c))
      .sort((a, b) => a.localeCompare(b));
    const joined = titles.join(', ');
    const tooltipRows: [string, string][] = [['Connections', joined]];
    const connectionNameForTab = titles.length === 1 ? titles[0] ?? '' : '';

    return {
      tooltip: tooltipRows,
      connectionName: connectionNameForTab,
    };
  }, [activeConnections]);

  return (
    <WorkspaceTab
      {...props}
      connectionName={connectionName}
      type={WorkspaceName}
      title={WorkspaceName}
      tooltip={tooltip}
      iconGlyph="CurlyBraces"
    />
  );
}
