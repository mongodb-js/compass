import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';

export const WorkspaceName = 'Welcome' as const;

export function PluginTabTitleComponent({
  tabProps,
  workspaceProps,
}: {
  tabProps: WorkspaceTabCoreProps;
  workspaceProps: { id: string };
}) {
  return (
    <WorkspaceTab
      {...tabProps}
      id={workspaceProps.id}
      type={WorkspaceName}
      title={WorkspaceName}
      iconGlyph="Logo"
    />
  );
}
