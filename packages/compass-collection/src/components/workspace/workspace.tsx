import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { WorkspaceTabs, css, useHotkeys } from '@mongodb-js/compass-components';
import {
  selectNextTab,
  type CollectionTab,
  type CollectionTabsState,
  selectPreviousTab,
  moveTabByIndex,
  closeTabAtIndex,
  openNewTabForCurrentCollection,
  selectTabByIndex,
} from '../../modules/tabs';

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

/**
 * The collection workspace contains tabs of multiple collections.
 */
const Workspace = ({
  tabs,
  activeTabId,
  onSelectTab,
  onSelectNextTab,
  onSelectPreviousTab,
  onMoveTab,
  onCloseTab,
  onCreateNewTab,
}: {
  tabs: CollectionTab[];
  activeTabId: string | null;
  onSelectTab(index: number): void;
  onSelectNextTab(): void;
  onSelectPreviousTab(): void;
  onMoveTab(fromIndex: number, toIndex: number): void;
  onCloseTab(index: number): void;
  onCreateNewTab(): void;
}) => {
  const tabsForHeader = useMemo(() => {
    return tabs.map((tab) => {
      return {
        title: tab.selectedSubTabName,
        subtitle: tab.namespace,
        tabContentId: tab.id,
        iconGlyph: getIconGlyphForCollectionType(tab.type),
      } as const;
    });
  }, [tabs]);

  const selectedTabIndex = useMemo(() => {
    return tabs.findIndex((tab) => tab.id === activeTabId);
  }, [tabs, activeTabId]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  useHotkeys('ctrl + tab', onSelectNextTab);
  useHotkeys('ctrl + shift + tab', onSelectPreviousTab);
  useHotkeys('mod + shift + ]', onSelectNextTab);
  useHotkeys('mod + shift + [', onSelectPreviousTab);
  useHotkeys(
    'mod + w',
    (e) => {
      onCloseTab(selectedTabIndex);
      // This prevents the browser from closing the window
      // as this shortcut is used to exit the app.
      e.preventDefault();
    },
    [selectedTabIndex]
  );
  useHotkeys('mod + t', onCreateNewTab);

  return (
    <div className={workspaceStyles} data-testid="workspace-tabs">
      <WorkspaceTabs
        aria-label="Collection Tabs"
        onCreateNewTab={onCreateNewTab}
        onMoveTab={onMoveTab}
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        tabs={tabsForHeader}
        selectedTabIndex={selectedTabIndex}
      />
      {activeTab && (
        <div className={workspaceViewsStyles}>
          <div
            key={activeTab.id}
            id={activeTab.id}
            className={workspaceViewTabStyles}
          >
            {activeTab?.component}
          </div>
        </div>
      )}
    </div>
  );
};

const MappedWorkspace = connect(
  (state: CollectionTabsState) => {
    return {
      tabs: state.tabs,
      activeTabId: state.activeTabId,
    };
  },
  {
    onSelectTab: selectTabByIndex,
    onSelectNextTab: selectNextTab,
    onSelectPreviousTab: selectPreviousTab,
    onMoveTab: moveTabByIndex,
    onCloseTab: closeTabAtIndex,
    onCreateNewTab: openNewTabForCurrentCollection,
  }
)(Workspace);

export default MappedWorkspace;
export { Workspace };
