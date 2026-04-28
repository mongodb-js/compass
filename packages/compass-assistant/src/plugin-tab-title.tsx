import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { WorkspacePluginProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Assistant' as const;
export const TabTitle = 'MongoDB Assistant' as const;

type PluginTitleComponentProps = WorkspaceTabCoreProps &
  WorkspacePluginProps<typeof WorkspaceName>;

export function PluginTabTitleComponent(props: PluginTitleComponentProps) {
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={TabTitle}
      iconGlyph="Sparkle"
    />
  );
}
