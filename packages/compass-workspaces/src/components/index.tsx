import React, { useEffect, useRef } from 'react';
import { css } from '@mongodb-js/compass-components';
import { CompassSidebarPlugin } from '@mongodb-js/compass-sidebar';
import {
  getActiveTab,
  type OpenWorkspaceOptions,
  type WorkspaceTab,
  type WorkspacesState,
} from '../stores/workspaces';
import Workspaces from './workspaces';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { connect } from 'react-redux';

type WorkspacesWithSidebarProps = {
  activeWorkspace: WorkspaceTab | null;
  onActiveWorkspaceTabChange(ws: WorkspaceTab | null): void;
  initialWorkspaceTab?: OpenWorkspaceOptions;
  initialConnectionInfo?: ConnectionInfo;
};

const horizontalSplitStyles = css({
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'min-content auto',
  minHeight: 0,
});

const workspacesStyles = css({
  minHeight: 0,
  overflow: 'hidden',
});

const sidebarStyles = css({
  minHeight: 0,
});

const WorkspacesWithSidebar: React.FunctionComponent<
  WorkspacesWithSidebarProps
> = ({
  activeWorkspace,
  onActiveWorkspaceTabChange,
  initialConnectionInfo,
}) => {
  const onChange = useRef(onActiveWorkspaceTabChange);
  onChange.current = onActiveWorkspaceTabChange;
  useEffect(() => {
    onChange.current(activeWorkspace);
  }, [activeWorkspace]);
  return (
    <div className={horizontalSplitStyles}>
      <div className={sidebarStyles}>
        <CompassSidebarPlugin
          activeWorkspace={activeWorkspace}
          initialConnectionInfo={initialConnectionInfo}
        />
      </div>
      <div className={workspacesStyles}>
        <Workspaces></Workspaces>
      </div>
    </div>
  );
};

export default connect((state: WorkspacesState) => {
  return {
    activeWorkspace: getActiveTab(state),
  };
})(WorkspacesWithSidebar);
