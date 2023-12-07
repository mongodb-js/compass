import React, { useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { AppRegistryProvider } from 'hadron-app-registry';
import {
  ErrorBoundary,
  MongoDBLogoMark,
  WorkspaceTabs,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { WorkspaceTab, WorkspacesState } from '../stores/workspaces';
import {
  closeTab,
  getActiveTab,
  getLocalAppRegistryForTab,
  moveTab,
  emitOnTabChange,
  openTabFromCurrent,
  selectNextTab,
  selectPrevTab,
  selectTab,
} from '../stores/workspaces';
import { useWorkspacePlugin } from './workspaces-provider';
import toNS from 'mongodb-ns';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

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

  onSelectTab(at: number): void;
  onSelectNextTab(): void;
  onSelectPrevTab(): void;
  onMoveTab(from: number, to: number): void;
  onCreateTab(): void;
  onCloseTab(at: number): void;

  onTabChange?: (tab: WorkspaceTab) => void;
};

const CompassWorkspaces: React.FunctionComponent<CompassWorkspacesProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  onSelectNextTab,
  onSelectPrevTab,
  onMoveTab,
  onCreateTab,
  onCloseTab,
  onTabChange,
}) => {
  const { log, mongoLogId } = useLoggerAndTelemetry('COMPASS-WORKSPACES');
  const getWorkspaceByName = useWorkspacePlugin();

  useEffect(() => {
    if (activeTab) {
      onTabChange?.(activeTab);
    }
  }, [
    onTabChange,
    activeTab?.type,
    (activeTab as { namespace: string } | undefined)?.namespace,
  ]);

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
          const viewOnCollection = tab.sourceName
            ? toNS(tab.sourceName).collection
            : null;
          // TODO: make sure metadata is resolved by collection-tab
          const collectionType = tab.isTimeSeries
            ? 'timeseries'
            : tab.isReadonly
            ? 'view'
            : 'collection';
          const subtitle = viewOnCollection
            ? `${database} > ${viewOnCollection} > ${collection}`
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
  }, [tabs]);

  const activeTabIndex = tabs.findIndex((tab) => tab === activeTab);

  const activeWorkspaceElement = useMemo(() => {
    switch (activeTab?.type) {
      case 'My Queries':
      case 'Performance':
      case 'Databases': {
        const Component = getWorkspaceByName(activeTab.type);
        return <Component></Component>;
      }
      case 'Collections': {
        const Component = getWorkspaceByName(activeTab.type);
        return <Component namespace={activeTab.namespace}></Component>;
      }
      case 'Collection': {
        const Component = getWorkspaceByName(activeTab.type);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, type, ...collectionMetadata } = activeTab;
        // TODO: make sure metadata is resolved by collection-tab
        return <Component {...collectionMetadata}></Component>;
      }
      default:
        return null;
    }
  }, [activeTab, getWorkspaceByName]);

  return (
    <div className={workspacesContainerStyles}>
      <WorkspaceTabs
        aria-label="Workspace Tabs"
        onSelectTab={onSelectTab}
        onSelectNextTab={onSelectNextTab}
        onSelectPrevTab={onSelectPrevTab}
        onMoveTab={onMoveTab}
        onCreateNewTab={onCreateTab}
        onCloseTab={onCloseTab}
        tabs={tabDescriptions}
        selectedTabIndex={activeTabIndex}
      ></WorkspaceTabs>

      <div className={workspacesContentStyles}>
        {activeTab && activeWorkspaceElement ? (
          <AppRegistryProvider
            key={activeTab.id}
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
        ) : (
          <EmptyWorkspaceContent></EmptyWorkspaceContent>
        )}
      </div>
    </div>
  );
};

export default connect(
  (state: WorkspacesState) => {
    return {
      tabs: state.tabs,
      activeTab: getActiveTab(state),
    };
  },
  {
    onSelectTab: selectTab,
    onSelectNextTab: selectNextTab,
    onSelectPrevTab: selectPrevTab,
    onMoveTab: moveTab,
    onCreateTab: openTabFromCurrent,
    onCloseTab: closeTab,
    onTabChange: emitOnTabChange,
  }
)(CompassWorkspaces);
