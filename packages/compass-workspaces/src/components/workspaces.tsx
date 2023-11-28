import React, { useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { AppRegistryProvider } from 'hadron-app-registry';
import { WorkspaceTabs, css } from '@mongodb-js/compass-components';
import type {
  OpenWorkspaceOptions,
  WorkspaceTab,
  WorkspacesState,
} from '../stores/workspaces';
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
  initialTab?: OpenWorkspaceOptions;

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
  const Workspace = useWorkspacePlugin(activeTab?.type ?? '');

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
          };
        case 'Databases':
          return {
            id: tab.id,
            title: tab.type,
            iconGlyph: 'Database',
          };
        case 'Performance':
          return {
            id: tab.id,
            title: tab.type,
            iconGlyph: 'Gauge',
          };
        case 'Collections':
          return {
            id: tab.id,
            title: tab.namespace,
            iconGlyph: 'Database',
          };
        case 'Collection': {
          const { database, collection } = toNS(tab.namespace);
          return {
            id: tab.id,
            title: collection,
            subtitle: `${database} > ${collection}`,
            iconGlyph:
              tab.collectionType === 'view'
                ? 'Visibility'
                : tab.collectionType === 'timeseries'
                ? 'TimeSeries'
                : 'Folder',
          };
        }
      }
    });
  }, [tabs]);

  if (!activeTab) {
    return null;
  }

  if (!Workspace) {
    throw new Error(
      `Trying to open a tab of type "${activeTab.type}", but the corresponding plugin is not provided in context. Did you forget to set up WorkspacesProvider?`
    );
  }

  const activeTabIndex = tabs.findIndex((tab) => tab === activeTab);

  // TODO: make sure metadata is resolved by collection-tab
  const activeTabProps =
    activeTab.type === 'Collections'
      ? { namespace: activeTab.namespace }
      : activeTab.type === 'Collection'
      ? activeTab.metadata
      : {};

  return (
    <div className={workspacesContainerStyles}>
      <WorkspaceTabs
        aria-label="Workspace Tabs"
        onSelectTab={onSelectTab}
        onSelectNextTab={onSelectNextTab}
        onSelectPrevTab={onSelectPrevTab}
        onMoveTab={onMoveTab}
        onCreateTab={onCreateTab}
        onCloseTab={onCloseTab}
        tabs={tabDescriptions}
        selectedTabIndex={activeTabIndex}
      ></WorkspaceTabs>

      <div className={workspacesContentStyles}>
        <AppRegistryProvider
          key={activeTab.id}
          localAppRegistry={getLocalAppRegistryForTab(activeTab.id)}
          deactivateOnUnmount={false}
        >
          <Workspace {...(activeTabProps as any)}></Workspace>
        </AppRegistryProvider>
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
