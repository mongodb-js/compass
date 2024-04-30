import React, { useCallback, useMemo } from 'react';
import { AppRegistryProvider } from 'hadron-app-registry';
import {
  ErrorBoundary,
  MongoDBLogoMark,
  WorkspaceTabs,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type {
  CollectionTabInfo,
  OpenWorkspaceOptions,
  WorkspaceTab,
  WorkspacesState,
} from '../stores/workspaces';
import {
  closeTab,
  getActiveTab,
  getLocalAppRegistryForTab,
  moveTab,
  openFallbackTab,
  openTabFromCurrent,
  selectNextTab,
  selectPrevTab,
  selectTab,
} from '../stores/workspaces';
import { useWorkspacePlugins } from './workspaces-provider';
import toNS from 'mongodb-ns';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { connect } from '../stores/context';
import { WorkspaceTabStateProvider } from './workspace-tab-state-provider';
import { NamespaceProvider } from '@mongodb-js/compass-app-stores/provider';
import {
  type ConnectionInfo,
  ConnectionInfoProvider,
} from '@mongodb-js/compass-connections/provider';

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
  openOnEmptyWorkspace?: OpenWorkspaceOptions | null;
  singleConnectionConnectionInfo?: ConnectionInfo;

  onSelectTab(at: number): void;
  onSelectNextTab(): void;
  onSelectPrevTab(): void;
  onMoveTab(from: number, to: number): void;
  onCreateTab(defaultTab?: OpenWorkspaceOptions | null): void;
  onCloseTab(at: number): void;
  onNamespaceNotFound(
    tab: WorkspaceTab,
    connectionId: string,
    fallbackNamespace: string | null
  ): void;
};

const CompassWorkspaces: React.FunctionComponent<CompassWorkspacesProps> = ({
  tabs,
  activeTab,
  collectionInfo,
  openOnEmptyWorkspace,
  onSelectTab,
  onSelectNextTab,
  onSelectPrevTab,
  onMoveTab,
  onCreateTab,
  onCloseTab,
  onNamespaceNotFound,
  singleConnectionConnectionInfo,
}) => {
  const { log, mongoLogId } = useLoggerAndTelemetry('COMPASS-WORKSPACES');
  const { getWorkspacePluginByName } = useWorkspacePlugins();

  const tabDescriptions = useMemo(() => {
    return tabs.map((tab) => {
      switch (tab.type) {
        case 'My Queries':
          return {
            id: tab.id,
            title: tab.type,
            iconGlyph: 'CurlyBraces',
          } as const;
        case 'Databases':
          return {
            id: tab.id,
            title: tab.type,
            iconGlyph: 'Database',
          } as const;
        case 'Performance':
          return {
            id: tab.id,
            title: tab.type,
            iconGlyph: 'Gauge',
          } as const;
        case 'Collections':
          return {
            id: tab.id,
            title: tab.namespace,
            iconGlyph: 'Database',
            'data-namespace': tab.namespace,
          } as const;
        case 'Collection': {
          const { database, collection, ns } = toNS(tab.namespace);
          const info = collectionInfo[ns] ?? {};
          const { isTimeSeries, isReadonly, sourceName } = info;
          const collectionType = isTimeSeries
            ? 'timeseries'
            : isReadonly
            ? 'view'
            : 'collection';
          // Similar to what we have in the collection breadcrumbs.
          const subtitle = sourceName
            ? `${database} > ${toNS(sourceName).collection} > ${collection}`
            : tab.editViewName
            ? `${database} > ${collection} > ${
                toNS(tab.editViewName).collection
              }`
            : `${database} > ${collection}`;
          return {
            id: tab.id,
            title: collection,
            subtitle,
            iconGlyph:
              collectionType === 'view'
                ? 'Visibility'
                : collectionType === 'timeseries'
                ? 'TimeSeries'
                : 'Folder',
            'data-namespace': ns,
          } as const;
        }
      }
    });
  }, [tabs, collectionInfo]);

  const activeTabIndex = tabs.findIndex((tab) => tab === activeTab);

  const activeWorkspaceElement = useMemo(() => {
    switch (activeTab?.type) {
      // TODO: Remove the ConnectionInfoProvider when we make My Queries
      // workspace work independently of a DataService
      case 'My Queries': {
        const Component = getWorkspacePluginByName(activeTab.type);
        return (
          <ConnectionInfoProvider
            connectionInfoId={singleConnectionConnectionInfo?.id}
          >
            <Component></Component>
          </ConnectionInfoProvider>
        );
      }
      case 'Performance':
      case 'Databases': {
        const Component = getWorkspacePluginByName(activeTab.type);
        return (
          <ConnectionInfoProvider connectionInfoId={activeTab.connectionId}>
            <Component></Component>
          </ConnectionInfoProvider>
        );
      }
      case 'Collections': {
        const Component = getWorkspacePluginByName(activeTab.type);
        return (
          <ConnectionInfoProvider connectionInfoId={activeTab.connectionId}>
            <NamespaceProvider
              namespace={activeTab.namespace}
              onNamespaceFallbackSelect={(ns) => {
                onNamespaceNotFound(activeTab, activeTab.connectionId, ns);
              }}
            >
              <Component namespace={activeTab.namespace}></Component>
            </NamespaceProvider>
          </ConnectionInfoProvider>
        );
      }
      case 'Collection': {
        const Component = getWorkspacePluginByName(activeTab.type);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, type, connectionId, ...collectionMetadata } = activeTab;
        return (
          <ConnectionInfoProvider connectionInfoId={activeTab.connectionId}>
            <NamespaceProvider
              namespace={activeTab.namespace}
              onNamespaceFallbackSelect={(ns) => {
                onNamespaceNotFound(activeTab, activeTab.connectionId, ns);
              }}
            >
              <Component tabId={id} {...collectionMetadata}></Component>
            </NamespaceProvider>
          </ConnectionInfoProvider>
        );
      }
      default:
        return null;
    }
  }, [
    singleConnectionConnectionInfo,
    activeTab,
    getWorkspacePluginByName,
    onNamespaceNotFound,
  ]);

  const onCreateNewTab = useCallback(() => {
    onCreateTab(openOnEmptyWorkspace);
  }, [onCreateTab, openOnEmptyWorkspace]);

  return (
    <div className={workspacesContainerStyles}>
      <WorkspaceTabs
        aria-label="Workspace Tabs"
        onSelectTab={onSelectTab}
        onSelectNextTab={onSelectNextTab}
        onSelectPrevTab={onSelectPrevTab}
        onMoveTab={onMoveTab}
        onCreateNewTab={onCreateNewTab}
        onCloseTab={onCloseTab}
        tabs={tabDescriptions}
        selectedTabIndex={activeTabIndex}
      ></WorkspaceTabs>

      <div className={workspacesContentStyles}>
        {activeTab && activeWorkspaceElement ? (
          <WorkspaceTabStateProvider id={activeTab.id}>
            <AppRegistryProvider
              key={activeTab.id}
              scopeName="Workspace Tab"
              localAppRegistry={getLocalAppRegistryForTab(activeTab.id)}
              deactivateOnUnmount={false}
            >
              <ErrorBoundary
                displayName={activeTab.type}
                onError={(error, errorInfo) => {
                  log.error(
                    mongoLogId(1_001_000_277),
                    'Workspace',
                    'Rendering workspace tab failed',
                    { name: activeTab.type, error: error.message, errorInfo }
                  );
                }}
              >
                {activeWorkspaceElement}
              </ErrorBoundary>
            </AppRegistryProvider>
          </WorkspaceTabStateProvider>
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
    };
  },
  {
    onSelectTab: selectTab,
    onSelectNextTab: selectNextTab,
    onSelectPrevTab: selectPrevTab,
    onMoveTab: moveTab,
    onCreateTab: openTabFromCurrent,
    onCloseTab: closeTab,
    onNamespaceNotFound: openFallbackTab,
  }
)(CompassWorkspaces);
