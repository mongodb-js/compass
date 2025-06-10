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
import { WorkspaceTab } from '../types';

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

// TODO: Move this somewhere shared. Also darkmode?
const nonExistantStyles = css({
  color: palette.gray.base,
});

// function useWorkspaceTabs(props: WorkspaceMetadata) {

// }

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
  const {
    // getWorkspacePluginContentByName,
    getWorkspacePlugins,
  } = useWorkspacePlugins();
  const { getThemeOf } = useTabConnectionTheme();
  const { getConnectionById } = useConnectionsListRef();

  const tabDescriptions = useMemo(() => {
    // TODO: Goal is to move all of these to the packages. Similar to collection tabs.

    // We should get the workspace by it's name and then pull the header from that.

    // TODO: We should error boundary and do the tooltip things here?
    // For now let's go less change and just move these type defs to those places.
    // TODO: make the WorkspaceTabProps header function accept the required args here.

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
  // const WorkspaceComponent = getWorkspacePluginContentByName(activeTab?.type);

  // TODO: We need all of the providers wrapping?
  // const WorkspaceProvider = getWorkspacePluginProviderByName(activeTab?.type);

  const onCreateNewTab = useCallback(() => {
    onCreateTab(openOnEmptyWorkspace);
  }, [onCreateTab, openOnEmptyWorkspace]);

  const workspaceTabs = useMemo(() => {
    const workspacePlugins = getWorkspacePlugins();
    return tabs.map((tab) => {
      const plugin = workspacePlugins.find((p) => p.name === tab.type);
      if (!plugin) {
        throw new Error(
          `Content component for workspace "${tab.type}" is missing in context. Did you forget to set up WorkspacesProvider?`
        );
      }
      const {
        content: WorkspaceTabContent,
        header: headerFn, // TODO: Not a fn, a component.
        provider,
      } = plugin;

      // getThemeOf(tab.connectionId)

      const Provider = provider as any;

      const header = headerFn(tab);

      return {
        // ...tab,
        header: headerFn(tab),
        // (
        //   <ErrorBoundary
        //     displayName={tab.type}
        //     onError={(error, errorInfo) => {
        //       log.error(
        //         mongoLogId(1_001_000_360),
        //         'Workspace',
        //         'Rendering workspace tab header failed',
        //         { name: tab.type, error: error.message, errorInfo }
        //       );
        //     }}
        //   >
        //     <WorkspaceTabContextProvider
        //       tab={tab}
        //       sectionType="tab-title"
        //       onNamespaceNotFound={onNamespaceNotFound}
        //     >
        //       <Provider
        //         // TODO
        //       >
        //         <WorkspaceTabHeader
        //           // TODO
        //         />
        //       </Provider>
        //     </WorkspaceTabContextProvider>
        //   </ErrorBoundary>
        // ),
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
              <Provider>
                <WorkspaceTabContent
                  {...(tab as any)} // TODO: This typing.
                />
              </Provider>
            </WorkspaceTabContextProvider>
          </ErrorBoundary>
        ),
      };
    });
  }, [getWorkspacePlugins, tabs, getThemeOf, getConnectionById]);

  const workspaceTabContent = workspaceTabs[activeTabIndex].content;

  return (
    <div
      className={workspacesContainerStyles}
      data-testid="workspace-tabs-container"
    >
      {/* TODO: Do we add the workspace tab context provider here now? */}
      <WorkspaceTabs
        aria-label="Workspace Tabs"
        onSelectTab={onSelectTab}
        onSelectNextTab={onSelectNextTab}
        onSelectPrevTab={onSelectPrevTab}
        onMoveTab={onMoveTab}
        onCreateNewTab={onCreateNewTab}
        onCloseTab={onCloseTab}
        // TabProps
        // Need to make the tabs render themselves? Or be opinionated in how they do it.
        // Right now they're opinionated objects.
        // Let's keep them as objects for now. We can update them in other prs.
        // tabs={tabDescriptions}
        tabs={workspaceTabs.map((tab) => tab.header)}
        // TODO: Don't do a function here.

        selectedTabIndex={activeTabIndex}
      ></WorkspaceTabs>

      <div className={workspacesContentStyles}>
        {activeTab && workspaceTabContent ? (
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
              {workspaceTabContent}
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
