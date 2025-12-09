import React from 'react';
import { connect } from 'react-redux';

import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { DataModelingState } from './store/reducer';
import type { WorkspacePluginProps } from '@mongodb-js/workspace-info';

export const WorkspaceName = 'Data Modeling' as const;

type WorkspaceProps = WorkspacePluginProps<typeof WorkspaceName>;
type PluginTabTitleProps = {
  tabTitle: string;
} & WorkspaceTabCoreProps &
  WorkspaceProps;

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
