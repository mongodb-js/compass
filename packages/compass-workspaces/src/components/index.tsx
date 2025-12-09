import React, { useEffect } from 'react';
import {
  css,
  cx,
  palette,
  useCurrentValueRef,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  getActiveTab,
  type WorkspacesState,
  type OpenWorkspaceOptions,
} from '../stores/workspaces';
import type {
  WorkspaceTab,
  CollectionTabInfo,
} from '@mongodb-js/workspace-info';

import Workspaces from './workspaces';
import { connect } from '../stores/context';
import { WorkspacesServiceProvider } from '../provider';
import { useSyncAssistantGlobalState } from '@mongodb-js/compass-assistant';

type WorkspacesWithSidebarProps = {
  /**
   * Current active workspace tab
   */
  activeTab: WorkspaceTab | null;
  /**
   * Collection info for the current active tab namespace (`null` if not fetched
   * yet or active tab is not of type Collection)
   */
  activeTabCollectionInfo: CollectionTabInfo | null;
  /**
   * Callback prop called when current active tab changes or collectionInfo for
   * the active tab changes (in case of Collection workspace)
   * @param ws current active workspace
   * @param collectionInfo active workspaces collection info
   */
  onActiveWorkspaceTabChange: <WS extends WorkspaceTab>(
    ws: WS | null,
    collectionInfo: WS extends { type: 'Collection' }
      ? CollectionTabInfo | null
      : never
  ) => void;
  /**
   * Initial workspace tab to show (by default no tabs will be shown initially)
   */
  initialWorkspaceTabs?: OpenWorkspaceOptions[] | null;
  /**
   * Workspace configuration to be opened when all tabs are closed (defaults to
   * "My Queries")
   */
  openOnEmptyWorkspace?: OpenWorkspaceOptions | null;
  /**
   * Workspaces sidebar component slot Required so that plugin modals can be
   * rendered inside workspace React tree and access workspace state and actions
   * from service locator context
   */
  renderSidebar?: () => React.ReactElement | null;
  /**
   * Workspaces plugin modals components slot. Required so that plugin modals
   * can be rendered inside workspace React tree and access workspace state and
   * actions from service locator context
   */
  renderModals?: () => React.ReactElement | null;
  /**
   * Callback that will get passed another callback function that, when called,
   * would return back true or false depending on whether or not tabs can be
   * safely closed without losing any important unsaved changes
   */
  onBeforeUnloadCallbackRequest?: (canCloseCallback: () => boolean) => void;
};

const containerLightThemeStyles = css({
  backgroundColor: palette.white,
  color: palette.gray.dark2,
});

const containerDarkThemeStyles = css({
  backgroundColor: palette.black,
  color: palette.white,
});

const horizontalSplitStyles = css({
  width: '100%',
  height: '100%',
  display: 'grid',
  gridTemplateColumns: 'min-content auto',
  minHeight: 0,
  overflowX: 'auto',
});

const workspacesStyles = css({
  minHeight: 0,
  overflow: 'hidden',
  minWidth: '730px', // roughly the minimum needed for the CRUD toolbars
});

const sidebarStyles = css({
  minHeight: 0,
});

const WorkspacesWithSidebar: React.FunctionComponent<
  WorkspacesWithSidebarProps
> = ({
  activeTab,
  activeTabCollectionInfo,
  openOnEmptyWorkspace,
  onActiveWorkspaceTabChange,
  renderSidebar,
  renderModals,
}) => {
  const darkMode = useDarkMode();
  const onChange = useCurrentValueRef(onActiveWorkspaceTabChange);
  useEffect(() => {
    onChange.current(activeTab, activeTabCollectionInfo);
  }, [activeTab, activeTabCollectionInfo, onChange]);
  useSyncAssistantGlobalState('currentWorkspace', activeTab);
  useSyncAssistantGlobalState(
    'currentWorkspaceCollectionInfo',
    activeTabCollectionInfo
  );
  return (
    <WorkspacesServiceProvider>
      <div
        className={cx(
          horizontalSplitStyles,
          darkMode ? containerDarkThemeStyles : containerLightThemeStyles
        )}
      >
        <div className={sidebarStyles}>{renderSidebar?.()}</div>
        <div className={workspacesStyles}>
          <Workspaces openOnEmptyWorkspace={openOnEmptyWorkspace}></Workspaces>
        </div>
      </div>
      {renderModals?.()}
    </WorkspacesServiceProvider>
  );
};

export default connect((state: WorkspacesState) => {
  const activeTab = getActiveTab(state);
  return {
    activeTab,
    activeTabCollectionInfo:
      activeTab?.type === 'Collection'
        ? state.collectionInfo[
            `${activeTab.connectionId}.${activeTab.namespace}`
          ]
        : null,
  };
})(WorkspacesWithSidebar);
