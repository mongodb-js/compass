import type AppRegistry from 'hadron-app-registry';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import classnames from 'classnames';
import { WorkspaceTabs, css } from '@mongodb-js/compass-components';

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
import type { CollectionStatsObject } from '../../modules/stats';
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

function getTabType(isTimeSeries: boolean, isReadonly: boolean): string {
  if (isTimeSeries) {
    return 'timeseries';
  }
  if (isReadonly) {
    return 'view';
  }
  return 'collection';
}

/**
 * W key is key code 87.
 */
const KEY_W = 87;

/**
 * T key is key code 84.
 */
const KEY_T = 84;

/**
 * ] is 221.
 */
const KEY_CLOSE_BRKT = 221;

/**
 * [ = 219
 */
const KEY_OPEN_BRKT = 219;

const DEFAULT_NEW_TAB = {
  namespace: '',
  isReadonly: false,
  isTimeSeries: false,
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
  changeActiveSubTab: (
    activeSubTab: number,
    id: string
  ) => {
    type: string;
    activeSubTab: number;
    id: string;
  };
  stats: CollectionStatsObject;
};

/**
 * The collection workspace contains tabs of multiple collections.
 */
class Workspace extends PureComponent<WorkspaceProps> {
  boundHandleKeypress: (evt: any) => void;

  static displayName = 'Workspace';

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props: WorkspaceProps) {
    super(props);
    this.boundHandleKeypress = this.handleKeypress.bind(this);
  }

  /**
   * Add the keypress listener on mount.
   */
  componentDidMount = (): void => {
    window.addEventListener('keydown', this.boundHandleKeypress);
  };

  /**
   * Remove the keypress listener on unmount.
   */
  componentWillUnmount = (): void => {
    window.removeEventListener('keydown', this.boundHandleKeypress);
  };

  onCreateNewTab = (): void => {
    const activeTab = this.activeTab();
    const newTabProps = activeTab
      ? {
          namespace: activeTab.namespace,
          isReadonly: activeTab.isReadonly,
          isTimeSeries: activeTab.isTimeSeries,
          isClustered: activeTab.isClustered,
          sourceName: activeTab.sourceName,
          editViewName: activeTab.editViewName,
          sourceReadonly: activeTab.sourceReadonly,
          sourceViewOn: activeTab.sourceViewOn,
          sourcePipeline: activeTab.pipeline,
        }
      : DEFAULT_NEW_TAB;
    this.props.createNewTab(newTabProps);
  };

  /**
   * Handle key press. This listens for CTRL/CMD+T and CTRL/CMD+W to control
   * natural opening and closing of collection tabs. CTRL/CMD+SHIFT+] and
   * CTRL/CMD+SHIFT+[ to go forward and backwards through the tabs.
   *
   * @param {Event} evt - The event.
   */
  handleKeypress = (evt: any): void => {
    if (evt.ctrlKey || evt.metaKey) {
      if (evt.shiftKey) {
        if (evt.keyCode === KEY_CLOSE_BRKT) {
          this.props.nextTab();
        } else if (evt.keyCode === KEY_OPEN_BRKT) {
          this.props.prevTab();
        }
      } else if (evt.keyCode === KEY_W) {
        this.props.closeTab(
          this.props.tabs.findIndex((tab: WorkspaceTabObject) => tab.isActive)
        );
        if (this.props.tabs.length > 0) {
          evt.preventDefault();
        }
      } else if (evt.keyCode === KEY_T) {
        this.onCreateNewTab();
      }
    }
  };

  /**
   * Return the active tab.
   *
   * @returns {Object} The active tab.
   */
  activeTab(): any {
    return this.props.tabs.find((tab: WorkspaceTabObject) => tab.isActive);
  }

  /**
   * Render the views.
   *
   * @returns {Component} The views.
   */
  renderViews(): React.ReactElement[] {
    return this.props.tabs.map((tab: WorkspaceTabObject) => {
      const viewTabClass = classnames({
        [workspaceViewTabStyles]: true,
        hidden: !tab.isActive,
      });
      return (
        <div
          className={viewTabClass}
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
            sourceName={tab.sourceName}
            editViewName={tab.editViewName}
            sourceReadonly={tab.sourceReadonly}
            sourceViewOn={tab.sourceViewOn}
            tabs={tab.tabs}
            views={tab.views}
            scopedModals={tab.scopedModals}
            queryHistoryIndexes={tab.queryHistoryIndexes}
            activeSubTab={tab.activeSubTab}
            pipeline={tab.pipeline}
            changeActiveSubTab={this.props.changeActiveSubTab}
            selectOrCreateTab={this.props.selectOrCreateTab}
            globalAppRegistry={this.props.appRegistry}
            localAppRegistry={tab.localAppRegistry}
            stats={this.props.stats}
          />
        </div>
      );
    });
  }

  formatCompassComponentsWorkspaceTabs = (): any =>
    this.props.tabs.map((tab: WorkspaceTabObject) => ({
      title: tab.activeSubTabName,
      subtitle: tab.namespace,
      tabContentId: tab.id,
      iconGlyph: getIconGlyphForCollectionType(
        getTabType(tab.isTimeSeries, tab.isReadonly)
      ),
    }));

  /**
   * Render the Workspace component.
   *
   * @returns {Component} The rendered component.
   */
  render(): React.ReactElement {
    const selectedTabIndex = this.props.tabs.findIndex(
      (tab: WorkspaceTabObject) => tab.isActive
    );

    return (
      <div className={workspaceStyles} data-test-id="workspace-tabs">
        <WorkspaceTabs
          aria-label="Collection Tabs"
          onCreateNewTab={this.onCreateNewTab}
          onMoveTab={this.props.moveTab}
          onSelectTab={this.props.selectTab}
          onCloseTab={this.props.closeTab}
          tabs={this.formatCompassComponentsWorkspaceTabs()}
          selectedTabIndex={selectedTabIndex}
        />
        <div className={workspaceViewsStyles}>{this.renderViews()}</div>
      </div>
    );
  }
}

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
