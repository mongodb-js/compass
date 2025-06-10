import React from 'react';
import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';

export const WorkspaceName = 'My Queries' as const;

export function PluginTabTitle(workspaceProps: { id: string }) {
  return (tabProps: WorkspaceTabCoreProps) => (
    <WorkspaceTab
      {...tabProps}
      id={workspaceProps.id}
      type={WorkspaceName}
      title={WorkspaceName}
      iconGlyph="CurlyBraces"
    />
  );
}
