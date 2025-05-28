import React, { useCallback, useMemo } from 'react';
import {
  ErrorBoundary,
  MongoDBLogoMark,
  WorkspaceTabs,
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type {
  CollectionTabInfo,
  DatabaseTabInfo,
  OpenWorkspaceOptions,
  WorkspaceTab,
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
import { useTabConnectionTheme } from '@mongodb-js/compass-connections/provider';
import { useConnectionsListRef } from '@mongodb-js/compass-connections/provider';
import { WorkspaceTabContextProvider } from './workspace-tab-context-provider';

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

const nonExistantStyles = css({
  color: palette.gray.base,
});

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
  const { getThemeOf } = useTabConnectionTheme();
  const { getConnectionById } = useConnectionsListRef();

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
        case 'Data Modeling':
          return {
            id: tab.id,
            type: tab.type,
            title: tab.type,
            iconGlyph: 'Diagram' as const,
          };
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
            title: connectionName,
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
            title: `Performance: ${connectionName}`,
            tooltip: [['Performance', connectionName || '']] as Tooltip,
            iconGlyph: 'Gauge',
            tabTheme: getThemeOf(tab.connectionId),
          } as const;
        }
        case 'Collections': {
          const connectionName =
            getConnectionById(tab.connectionId)?.title || '';
          const database = tab.namespace;
          const namespaceId = `${tab.connectionId}.${database}`;
          const { isNonExistent } = databaseInfo[namespaceId] ?? {};
          return {
            id: tab.id,
            connectionName,
            type: tab.type,
            title: database,
            tooltip: [
              ['Connection', connectionName || ''],
              ['Database', database],
            ] as Tooltip,
            iconGlyph: isNonExistent ? 'EmptyDatabase' : 'Database',
            'data-namespace': tab.namespace,
            tabTheme: getThemeOf(tab.connectionId),
            ...(isNonExistent && {
              className: nonExistantStyles,
            }),
          } as const;
        }
        case 'Collection': {
          const { database, collection, ns } = toNS(tab.namespace);
          const namespaceId = `${tab.connectionId}.${ns}`;
          const info = collectionInfo[namespaceId] ?? {};
          const { isTimeSeries, isReadonly, sourceName, isNonExistent } = info;
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
                : isNonExistent
                ? 'EmptyFolder'
                : 'Folder',
            'data-namespace': ns,
            tabTheme: getThemeOf(tab.connectionId),
            ...(isNonExistent && {
              className: nonExistantStyles,
            }),
          } as const;
        }
      }
    });
  }, [tabs, collectionInfo, databaseInfo, getThemeOf, getConnectionById]);

  const activeTabIndex = tabs.findIndex((tab) => tab === activeTab);
  const WorkspaceComponent = getWorkspacePluginByName(activeTab?.type);

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
        {activeTab && WorkspaceComponent ? (
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
            <WorkspaceTabContextProvider
              tab={activeTab}
              sectionType="tab-content"
              onNamespaceNotFound={onNamespaceNotFound}
            >
              <WorkspaceComponent></WorkspaceComponent>
            </WorkspaceTabContextProvider>
          </ErrorBoundary>
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
