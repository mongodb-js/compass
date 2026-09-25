import React from 'react';
import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Welcome' as const;

type PluginTitleComponentProps = PluginHeaderProps<typeof WorkspaceName>;

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
