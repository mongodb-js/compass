import React from 'react';
import { connect } from 'react-redux';

import {
  WorkspaceTab,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type { DataModelingState } from './store/reducer';

export const WorkspaceName = 'Data Modeling' as const;

type WorkspaceProps = {
  id: string;
};

function _TabTitle({
  tabProps,
  tabTitle,
  workspaceProps,
}: {
  tabProps: WorkspaceTabCoreProps;
  tabTitle: string;
  workspaceProps: WorkspaceProps;
}) {
  return (
    <WorkspaceTab
      {...tabProps}
      id={workspaceProps.id}
      type={WorkspaceName}
      title={tabTitle}
      iconGlyph="Diagram"
    />
  );
}

const ConnectedTabTitle = connect((state: DataModelingState) => {
  return {
    tabTitle:
      state.step === 'NO_DIAGRAM_SELECTED'
        ? WorkspaceName
        : state.diagram?.name ?? WorkspaceName,
  };
})(_TabTitle);

export function PluginTabTitle(workspaceProps: WorkspaceProps) {
  return (tabProps: WorkspaceTabCoreProps) => (
    <ConnectedTabTitle tabProps={tabProps} workspaceProps={workspaceProps} />
  );
}
