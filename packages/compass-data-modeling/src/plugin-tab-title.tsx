import React from 'react';
import { connect } from 'react-redux';

import { WorkspaceTab } from '@mongodb-js/compass-components';
import type { DataModelingState } from './store/reducer';
import type { PluginHeaderProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Data Modeling' as const;

type PluginTabTitleProps = {
  tabTitle: string;
} & PluginHeaderProps<typeof WorkspaceName>;

function _TabTitle({ tabTitle, ...props }: PluginTabTitleProps) {
  return (
    <WorkspaceTab
      {...props}
      type={WorkspaceName}
      title={tabTitle}
      iconGlyph="Diagram"
    />
  );
}

export const PluginTabTitleComponent = connect((state: DataModelingState) => {
  return {
    tabTitle:
      state.step === 'NO_DIAGRAM_SELECTED'
        ? WorkspaceName
        : state.diagram?.name ?? WorkspaceName,
  };
})(_TabTitle);
