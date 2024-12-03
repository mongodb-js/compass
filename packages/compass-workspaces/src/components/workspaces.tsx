import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AppRegistryProvider } from 'hadron-app-registry';
import {
  ErrorBoundary,
  MongoDBLogoMark,
  WorkspaceTabs,
  css,
  rafraf,
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
import {
  WorkspaceTabStateProvider,
  useTabState,
} from './workspace-tab-state-provider';
import { useOnTabReplace } from './workspace-close-handler';
import { NamespaceProvider } from '@mongodb-js/compass-app-stores/provider';
import {
  ConnectionInfoProvider,
  useTabConnectionTheme,
} from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';

type Tooltip = [string, string][];

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

const ActiveTabCloseHandler: React.FunctionComponent = ({ children }) => {
  const mountedRef = useRef(false);
  const [hasInteractedOnce, setHasInteractedOnce] = useTabState(
    'hasInteractedOnce',
    false
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  });

  const markAsInteracted = useCallback(() => {
    // Make sure we don't count clicking on buttons that actually cause the
    // workspace to change, like using breadcrumbs or clicking on an item in the
    // Databases / Collections list. There are certain corner-cases this doesn't
    // handle, but it's good enough to prevent most cases where users can lose
    // content by accident
    rafraf(() => {
      if (mountedRef.current) {
        setHasInteractedOnce(true);
      }
    });
  }, [setHasInteractedOnce]);

  useOnTabReplace(() => {
    return !hasInteractedOnce;
  });

  return (
    // We're not using these for actual user interactions, just to capture the
    // interacted state
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      style={{ display: 'contents' }}
      onKeyDown={markAsInteracted}
      onClickCapture={markAsInteracted}
    >
      {children}
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
  const { getThemeOf } = useTabConnectionTheme();
  const { getConnectionById } = useConnectionsListRef();
  const multipleConnectionsEnabled = usePreference(
    'enableMultipleConnectionSystem'
  );

  const tabDescriptions = useMemo(() => {
    return tabs.map((tab) => {
      switch (tab.type) {
        case 'Welcome':
          return {
            id: tab.id,
            type: tab.type,
            title: tab.type,
            iconGlyph: 'Logo',
          } as const;
        case 'My Queries':
          return {
            id: tab.id,
            type: tab.type,
            title: tab.type,
            iconGlyph: 'CurlyBraces',
          } as const;
        case 'Shell': {
          const connectionName =
            getConnectionById(tab.connectionId)?.title || '';
          const tooltip: Tooltip = [];
          if (connectionName) {
            tooltip.push(['mongosh', connectionName || '']);
          }
          return {
            id: tab.id,
            connectionName,
            type: tab.type,
            title: connectionName
              ? `mongosh: ${connectionName}`
              : 'MongoDB Shell',
            tooltip,
            iconGlyph: 'Shell',
            tabTheme: getThemeOf(tab.connectionId),
          } as const;
        }
        case 'Databases': {
          const connectionName =
            getConnectionById(tab.connectionId)?.title || '';
          return {
            id: tab.id,
            connectionName,
            type: tab.type,
            title: multipleConnectionsEnabled ? connectionName : tab.type,
            tooltip: [['Connection', connectionName || '']] as Tooltip,
            iconGlyph: 'Server',
            tabTheme: getThemeOf(tab.connectionId),
          } as const;
        }
        case 'Performance': {
          const connectionName =
            getConnectionById(tab.connectionId)?.title || '';
          return {
            id: tab.id,
            connectionName,
            type: tab.type,
            title: multipleConnectionsEnabled
              ? `Performance: ${connectionName}`
              : tab.type,
            tooltip: [['Performance', connectionName || '']] as Tooltip,
            iconGlyph: 'Gauge',
            tabTheme: getThemeOf(tab.connectionId),
          } as const;
        }
        case 'Collections': {
          const connectionName =
            getConnectionById(tab.connectionId)?.title || '';
          const database = tab.namespace;
          return {
            id: tab.id,
            connectionName,
            type: tab.type,
            title: database,
            tooltip: [
              ['Connection', connectionName || ''],
              ['Database', database],
            ] as Tooltip,
            iconGlyph: 'Database',
            'data-namespace': tab.namespace,
            tabTheme: getThemeOf(tab.connectionId),
          } as const;
        }
        case 'Collection': {
          const { database, collection, ns } = toNS(tab.namespace);
          const info = collectionInfo[ns] ?? {};
          const { isTimeSeries, isReadonly, sourceName } = info;
          const connectionName =
            getConnectionById(tab.connectionId)?.title || '';
          const collectionType = isTimeSeries
            ? 'timeseries'
            : isReadonly
            ? 'view'
            : 'collection';
          // Similar to what we have in the collection breadcrumbs.
          const tooltip: Tooltip = [
            ['Connection', connectionName || ''],
            ['Database', database],
          ];
          if (sourceName) {
            tooltip.push(['View', collection]);
            tooltip.push(['Derived from', toNS(sourceName).collection]);
          } else if (tab.editViewName) {
            tooltip.push(['View', toNS(tab.editViewName).collection]);
            tooltip.push(['Derived from', collection]);
          } else {
            tooltip.push(['Collection', collection]);
          }
          return {
            id: tab.id,
            connectionName,
            type: tab.type,
            title: collection,
            tooltip,
            iconGlyph:
              collectionType === 'view'
                ? 'Visibility'
                : collectionType === 'timeseries'
                ? 'TimeSeries'
                : 'Folder',
            'data-namespace': ns,
            tabTheme: getThemeOf(tab.connectionId),
          } as const;
        }
      }
    });
  }, [
    tabs,
    collectionInfo,
    getThemeOf,
    getConnectionById,
    multipleConnectionsEnabled,
  ]);

  const activeTabIndex = tabs.findIndex((tab) => tab === activeTab);

  const activeWorkspaceElement = useMemo(() => {
    switch (activeTab?.type) {
      case 'Welcome':
      case 'My Queries': {
        const Component = getWorkspacePluginByName(activeTab.type);
        return <Component></Component>;
      }
      case 'Shell': {
        const Component = getWorkspacePluginByName(activeTab.type);
        return (
          <ConnectionInfoProvider connectionInfoId={activeTab.connectionId}>
            <Component
              initialEvaluate={activeTab.initialEvaluate}
              initialInput={activeTab.initialInput}
            ></Component>
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
                onNamespaceNotFound(activeTab, ns);
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
                onNamespaceNotFound(activeTab, ns);
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
  }, [activeTab, getWorkspacePluginByName, onNamespaceNotFound]);

  const onCreateNewTab = useCallback(() => {
    onCreateTab(openOnEmptyWorkspace);
  }, [onCreateTab, openOnEmptyWorkspace]);

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
              <ActiveTabCloseHandler>
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
              </ActiveTabCloseHandler>
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
    onNamespaceNotFound: openFallbackWorkspace,
  }
)(CompassWorkspaces);
