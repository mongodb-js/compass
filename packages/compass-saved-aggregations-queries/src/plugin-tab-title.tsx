import React from 'react';
import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'My Queries' as const;

type PluginTabTitleProps = PluginHeaderProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTabTitleProps) {
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={WorkspaceName}
      iconGlyph="CurlyBraces"
    />
  );
}
