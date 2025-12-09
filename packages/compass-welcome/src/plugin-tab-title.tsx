import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { WorkspacePluginProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Welcome' as const;

type PluginTitleComponentProps = WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTitleComponentProps) {
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={WorkspaceName}
      iconGlyph="Logo"
    />
  );
}
