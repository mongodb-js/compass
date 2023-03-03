import type AppRegistry from 'hadron-app-registry';
import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  WorkspaceTabs,
  css,
  cx,
  useHotkeys,
} from '@mongodb-js/compass-components';

import {
  createNewTab,
  selectOrCreateTab,
  closeTab,
  prevTab,
  nextTab,
  moveTab,
  selectTab,
  changeActiveSubTab,
} from '../../modules/tabs';
import type { WorkspaceTabObject } from '../../modules/tabs';
import type { CollectionStatsMap } from '../../modules/stats';
import Collection from '../collection';

const workspaceStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const workspaceViewsStyles = css({
  height: '100%',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'auto',
});

const workspaceViewTabStyles = css({
  height: '100%',
  width: '100%',
});

const workspaceHiddenStyles = css({
  display: 'none',
});

function getTabType(isTimeSeries: boolean, isReadonly: boolean): string {
  if (isTimeSeries) {
    return 'timeseries';
  }
  if (isReadonly) {
    return 'view';
  }
  return 'collection';
}

const DEFAULT_NEW_TAB = {
  namespace: '',
  isReadonly: false,
  isTimeSeries: false,
  isClustered: false,
  isFLE: false,
  sourceName: '',
};

function getIconGlyphForCollectionType(type: string) {
  switch (type) {
    case 'timeseries':
      return 'TimeSeries';
    case 'view':
      return 'Visibility';
    default:
      return 'Folder';
  }
}

type WorkspaceProps = {
  tabs: WorkspaceTabObject[];
  closeTab: (index: number) => void;
  createNewTab: (props: any) => any;
  selectOrCreateTab: (props: any) => any;
  appRegistry: AppRegistry;
  prevTab: () => void;
  nextTab: () => void;
  moveTab: (
    fromIndex: number,
    toIndex: number
  ) => {
    type: string;
    fromIndex: number;
    toIndex: number;
  };
  selectTab: (index: number) => {
    type: string;
    index: number;
  };
  changeActiveSubTab: (activeSubTab: number, id: string) => void;
  stats: CollectionStatsMap;
};

const WorkspaceTab = ({
  tab,
  changeActiveSubTab,
  selectOrCreateTab,
  globalAppRegistry,
  localAppRegistry,
  stats,
}: {
  tab: WorkspaceTabObject;
  changeActiveSubTab: (activeSubTab: number, id: string) => void;
  selectOrCreateTab: (props: any) => any;
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  stats: CollectionStatsMap;
}) => {
  return (
    <div
      className={cx(
        workspaceViewTabStyles,
        !tab.isActive && workspaceHiddenStyles
      )}
      id={tab.id}
      key={`${String(tab.id)}-wrap`}
    >
      <Collection
        key={tab.id}
        id={tab.id}
        namespace={tab.namespace}
        isReadonly={tab.isReadonly}
        isTimeSeries={tab.isTimeSeries}
        isClustered={tab.isClustered}
        isFLE={tab.isFLE}
        sourceName={tab.sourceName}
        editViewName={tab.editViewName}
        sourceReadonly={tab.sourceReadonly}
        sourceViewOn={tab.sourceViewOn}
        tabs={tab.tabs}
        views={tab.views}
        scopedModals={tab.scopedModals}
        activeSubTab={tab.activeSubTab}
        pipeline={tab.pipeline}
        changeActiveSubTab={changeActiveSubTab}
        selectOrCreateTab={selectOrCreateTab}
        globalAppRegistry={globalAppRegistry}
        localAppRegistry={localAppRegistry}
        stats={stats}
      />
    </div>
  );
};

/**
 * The collection workspace contains tabs of multiple collections.
 */
const Workspace = ({
  tabs,
  closeTab,
  createNewTab,
  selectOrCreateTab,
  appRegistry,
  prevTab,
  nextTab,
  moveTab,
  selectTab,
  changeActiveSubTab,
  stats,
}: WorkspaceProps) => {
  const onCreateNewTab = useCallback(() => {
    const activeTab = tabs.find((tab: WorkspaceTabObject) => tab.isActive);
    const newTabProps = activeTab
      ? {
          namespace: activeTab.namespace,
          isReadonly: activeTab.isReadonly,
          isTimeSeries: activeTab.isTimeSeries,
          isClustered: activeTab.isClustered,
          isFLE: activeTab.isFLE,
          sourceName: activeTab.sourceName,
          editViewName: activeTab.editViewName,
          sourceReadonly: activeTab.sourceReadonly,
          sourceViewOn: activeTab.sourceViewOn,
          sourcePipeline: activeTab.pipeline,
        }
      : DEFAULT_NEW_TAB;
    createNewTab(newTabProps);
  }, [tabs, createNewTab]);

  const formatCompassComponentsWorkspaceTabs = useMemo((): any => {
    return tabs.map((tab: WorkspaceTabObject) => ({
      title: tab.activeSubTabName,
      subtitle: tab.namespace,
      tabContentId: tab.id,
      iconGlyph: getIconGlyphForCollectionType(
        getTabType(tab.isTimeSeries, tab.isReadonly)
      ),
    }));
  }, [tabs]);

  const selectedTabIndex = useMemo(
    () => tabs.findIndex((tab: WorkspaceTabObject) => tab.isActive),
    [tabs]
  );

  useHotkeys('meta + shift + ]', nextTab);
  useHotkeys('meta + shift + [', prevTab);
  useHotkeys(
    'meta + w',
    (e) => {
      closeTab(selectedTabIndex);
      // This prevents the browser from closing the window
      // as this shortcut is used to exit the app.
      e.preventDefault();
    },
    [selectedTabIndex]
  );
  useHotkeys('meta + t', onCreateNewTab);

  return (
    <div className={workspaceStyles} data-testid="workspace-tabs">
      <WorkspaceTabs
        aria-label="Collection Tabs"
        onCreateNewTab={onCreateNewTab}
        onMoveTab={moveTab}
        onSelectTab={selectTab}
        onCloseTab={closeTab}
        tabs={formatCompassComponentsWorkspaceTabs}
        selectedTabIndex={selectedTabIndex}
      />
      <div className={workspaceViewsStyles}>
        {tabs.map((tab: WorkspaceTabObject) => (
          <WorkspaceTab
            key={tab.id}
            tab={tab}
            changeActiveSubTab={changeActiveSubTab}
            selectOrCreateTab={selectOrCreateTab}
            globalAppRegistry={appRegistry}
            localAppRegistry={tab.localAppRegistry}
            stats={stats}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state: any) => ({
  tabs: state.tabs,
  appRegistry: state.appRegistry,
  stats: state.stats,
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedWorkspace = connect(mapStateToProps, {
  createNewTab,
  selectOrCreateTab,
  closeTab,
  prevTab,
  nextTab,
  moveTab,
  selectTab,
  changeActiveSubTab,
})(Workspace);

export default MappedWorkspace;
export { Workspace, getTabType };
