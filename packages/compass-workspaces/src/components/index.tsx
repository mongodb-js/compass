import React, { useEffect, useRef } from 'react';
import { css } from '@mongodb-js/compass-components';
import { CompassSidebarPlugin } from '@mongodb-js/compass-sidebar';
import type { CollectionTabInfo } from '../stores/workspaces';
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
  activeTab: WorkspaceTab | null;
  activeTabCollectionInfo: CollectionTabInfo | null;
  onActiveWorkspaceTabChange<WS extends WorkspaceTab>(
    ws: WS | null,
    collectionInfo: WS extends { type: 'Collection' }
      ? CollectionTabInfo | null
      : never
  ): void;
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
  activeTab,
  activeTabCollectionInfo,
  onActiveWorkspaceTabChange,
  initialConnectionInfo,
}) => {
  const onChange = useRef(onActiveWorkspaceTabChange);
  onChange.current = onActiveWorkspaceTabChange;
  useEffect(() => {
    onChange.current(activeTab, activeTabCollectionInfo);
  }, [activeTab, activeTabCollectionInfo]);
  return (
    <div className={horizontalSplitStyles}>
      <div className={sidebarStyles}>
        <CompassSidebarPlugin
          activeWorkspace={activeTab}
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
  const activeTab = getActiveTab(state);
  return {
    activeTab,
    activeTabCollectionInfo:
      activeTab?.type === 'Collection'
        ? state.collectionInfo[activeTab.namespace]
        : null,
  };
})(WorkspacesWithSidebar);
