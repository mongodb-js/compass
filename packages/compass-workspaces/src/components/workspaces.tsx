import React, { useCallback, useMemo } from 'react';
import {
  ErrorBoundary,
  MongoDBLogoMark,
  WorkspaceTabs,
  css,
  spacing,
  useDarkMode,
  type WorkspaceTabCoreProps,
} from '@mongodb-js/compass-components';
import type {
  CollectionTabInfo,
  DatabaseTabInfo,
  OpenWorkspaceOptions,
  WorkspacesState,
} from '../stores/workspaces';
import {
  closeTab,
  getActiveTab,
  moveTab,
  openFallbackWorkspace,
  openTabFromCurrent,
  selectNextTab,
  selectPrevTab,
  selectTab,
} from '../stores/workspaces';
import { useWorkspacePlugins } from './workspaces-provider';
import toNS from 'mongodb-ns';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { connect } from '../stores/context';
import { WorkspaceTabContextProvider } from './workspace-tab-context-provider';
import type { WorkspaceTab } from '../types';

const emptyWorkspaceStyles = css({
  margin: '0 auto',
  alignSelf: 'center',
  opacity: 0.05,
});

const EmptyWorkspaceContent = () => {
  const darkMode = useDarkMode();
  return (
    <div className={emptyWorkspaceStyles}>
      <MongoDBLogoMark
        height={spacing[7] * 2}
        color={darkMode ? 'white' : 'black'}
      ></MongoDBLogoMark>
    </div>
  );
};

const workspacesContainerStyles = css({
  display: 'grid',
  width: '100%',
  height: '100%',
  gridTemplateColumns: '100%',
  gridTemplateRows: 'auto 1fr',
});

const workspacesContentStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

type CompassWorkspacesProps = {
  tabs: WorkspaceTab[];
  activeTab?: WorkspaceTab | null;
  collectionInfo: Record<string, CollectionTabInfo>;
  databaseInfo: Record<string, DatabaseTabInfo>;
  openOnEmptyWorkspace?: OpenWorkspaceOptions | null;

  onSelectTab(at: number): void;
  onSelectNextTab(): void;
  onSelectPrevTab(): void;
  onMoveTab(from: number, to: number): void;
  onCreateTab(defaultTab?: OpenWorkspaceOptions | null): void;
  onCloseTab(at: number): void;
  onNamespaceNotFound(
    tab: Extract<WorkspaceTab, { namespace: string }>,
    fallbackNamespace: string | null
  ): void;
};

const CompassWorkspaces: React.FunctionComponent<CompassWorkspacesProps> = ({
  tabs,
  activeTab,
  collectionInfo,
  databaseInfo,
  openOnEmptyWorkspace,
  onSelectTab,
  onSelectNextTab,
  onSelectPrevTab,
  onMoveTab,
  onCreateTab,
  onCloseTab,
  onNamespaceNotFound,
}) => {
  const { log, mongoLogId } = useLogger('COMPASS-WORKSPACES');
  const { getWorkspacePluginByName } = useWorkspacePlugins();

  const activeTabIndex = tabs.findIndex((tab) => tab === activeTab);

  const onCreateNewTab = useCallback(() => {
    onCreateTab(openOnEmptyWorkspace);
  }, [onCreateTab, openOnEmptyWorkspace]);

  const workspaceTabs = useMemo(() => {
    return tabs.map((tab) => {
      const plugin = getWorkspacePluginByName(tab.type);
      if (!plugin) {
        throw new Error(
          `Content component for workspace "${tab.type}" is missing in context. Did you forget to set up WorkspacesProvider?`
        );
      }
      const { content: WorkspaceTabContent, header: WorkspaceTabTitle } =
        plugin;

      let isNonExistent: boolean | undefined;
      if (tab.type === 'Collections') {
        // TODO(COMPASS-9456): Move this logic and `isNonExistent` setting to the plugin.
        const database = tab.namespace;
        const namespaceId = `${tab.connectionId}.${database}`;
        const { isNonExistent: databaseDoesNotExist } =
          databaseInfo[namespaceId] ?? {};
        isNonExistent = databaseDoesNotExist;
      } else if (tab.type === 'Collection') {
        // TODO(COMPASS-9456): Move this logic and `isNonExistent` setting to the plugin.
        const { ns } = toNS(tab.namespace);
        const namespaceId = `${tab.connectionId}.${ns}`;
        const { isNonExistent: collectionDoesNotExist } =
          collectionInfo[namespaceId] ?? {};
        isNonExistent = collectionDoesNotExist;
      }

      return {
        id: tab.id,
        renderTab: (workspaceTabCoreProps: WorkspaceTabCoreProps) => (
          <ErrorBoundary
            displayName={tab.type}
            onError={(error, errorInfo) => {
              log.error(
                mongoLogId(1_001_000_360),
                'Workspace',
                'Rendering workspace tab header failed',
                { name: tab.type, error: error.message, errorInfo }
              );
            }}
          >
            <WorkspaceTabContextProvider tab={tab} sectionType="tab-title">
              <WorkspaceTabTitle
                {...workspaceTabCoreProps}
                {...(isNonExistent ? { isNonExistent } : {})}
              />
            </WorkspaceTabContextProvider>
          </ErrorBoundary>
        ),
        content: (
          <ErrorBoundary
            displayName={tab.type}
            onError={(error, errorInfo) => {
              log.error(
                mongoLogId(1_001_000_277),
                'Workspace',
                'Rendering workspace tab content failed',
                { name: tab.type, error: error.message, errorInfo }
              );
            }}
          >
            <WorkspaceTabContextProvider
              tab={tab}
              sectionType="tab-content"
              onNamespaceNotFound={onNamespaceNotFound}
            >
              <WorkspaceTabContent />
            </WorkspaceTabContextProvider>
          </ErrorBoundary>
        ),
      };
    });
  }, [
    getWorkspacePluginByName,
    tabs,
    log,
    collectionInfo,
    databaseInfo,
    mongoLogId,
    onNamespaceNotFound,
  ]);

  const workspaceTabContent = workspaceTabs[activeTabIndex]?.content ?? null;

  return (
    <div
      className={workspacesContainerStyles}
      data-testid="workspace-tabs-container"
    >
      <WorkspaceTabs
        aria-label="Workspace Tabs"
        onSelectTab={onSelectTab}
        onSelectNextTab={onSelectNextTab}
        onSelectPrevTab={onSelectPrevTab}
        onMoveTab={onMoveTab}
        onCreateNewTab={onCreateNewTab}
        onCloseTab={onCloseTab}
        tabs={workspaceTabs}
        selectedTabIndex={activeTabIndex}
      ></WorkspaceTabs>

      <div className={workspacesContentStyles}>
        {activeTab && workspaceTabContent ? (
          workspaceTabContent
        ) : (
          <EmptyWorkspaceContent></EmptyWorkspaceContent>
        )}
      </div>
    </div>
  );
};

export default connect(
  (state: WorkspacesState) => {
    const activeTab = getActiveTab(state);
    return {
      tabs: state.tabs,
      activeTab: activeTab,
      collectionInfo: state.collectionInfo,
      databaseInfo: state.databaseInfo,
    };
  },
  {
    onSelectTab: selectTab,
    onSelectNextTab: selectNextTab,
    onSelectPrevTab: selectPrevTab,
    onMoveTab: moveTab,
    onCreateTab: openTabFromCurrent,
    onCloseTab: closeTab,
    onNamespaceNotFound: openFallbackWorkspace,
  }
)(CompassWorkspaces);
