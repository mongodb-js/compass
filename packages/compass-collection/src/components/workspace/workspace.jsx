import React, { PureComponent, useMemo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { WorkspaceTabs } from '@mongodb-js/compass-workspace';
import { Icon } from '@mongodb-js/compass-components';

import {
  createNewTab,
  selectOrCreateTab,
  closeTab,
  prevTab,
  nextTab,
  moveTab,
  selectTab,
  changeActiveSubTab
} from '../../modules/tabs';
import Collection from '../collection';

import styles from './workspace.module.less';

export function getTabType(
  isTimeSeries,
  isReadonly
) {
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
  sourceName: ''
};

function renderTabIcon(tabIconProps, type) {
  const tabIcon = useMemo(() => {
    switch (type) {
      case 'timeseries':
        return 'TimeSeries';
      case 'view':
        return 'Visibility';
      default:
        return 'Folder';
    }
  }, [type]);

  return (
    <Icon
      {...tabIconProps}
      glyph={tabIcon}
    />
  );
}

/**
 * The collection workspace contains tabs of multiple collections.
 */
class Workspace extends PureComponent {
  static displayName = 'Workspace';

  static propTypes = {
    tabs: PropTypes.array.isRequired,
    closeTab: PropTypes.func.isRequired,
    createNewTab: PropTypes.func.isRequired,
    selectOrCreateTab: PropTypes.func.isRequired,
    appRegistry: PropTypes.object.isRequired,
    prevTab: PropTypes.func.isRequired,
    nextTab: PropTypes.func.isRequired,
    moveTab: PropTypes.func.isRequired,
    selectTab: PropTypes.func.isRequired,
    changeActiveSubTab: PropTypes.func.isRequired
  };

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.boundHandleKeypress = this.handleKeypress.bind(this);
  }

  /**
   * Add the keypress listener on mount.
   */
  componentDidMount() {
    window.addEventListener('keydown', this.boundHandleKeypress);
  }

  /**
   * Remove the keypress listener on unmount.
   */
  componentWillUnmount() {
    window.removeEventListener('keydown', this.boundHandleKeypress);
  }

  onCreateNewTab = () => {
    const activeTab = this.activeTab();
    const newTabProps = activeTab
      ? {
        namespace: activeTab.namespace,
        isReadonly: activeTab.isReadonly,
        isTimeSeries: activeTab.isTimeSeries,
        sourceName: activeTab.sourceName,
        editViewName: activeTab.editViewName,
        sourceReadonly: activeTab.sourceReadonly,
        sourceViewOn: activeTab.sourceViewOn,
        sourcePipeline: activeTab.pipeline
      }
      : DEFAULT_NEW_TAB;
    this.props.createNewTab(newTabProps);
  }

  /**
   * Handle key press. This listens for CTRL/CMD+T and CTRL/CMD+W to control
   * natural opening and closing of collection tabs. CTRL/CMD+SHIFT+] and
   * CTRL/CMD+SHIFT+[ to go forward and backwards through the tabs.
   *
   * @param {Event} evt - The event.
   */
  handleKeypress = (evt) => {
    if (evt.ctrlKey || evt.metaKey) {
      if (evt.shiftKey) {
        if (evt.keyCode === KEY_CLOSE_BRKT) {
          this.props.nextTab();
        } else if (evt.keyCode === KEY_OPEN_BRKT) {
          this.props.prevTab();
        }
      } else if (evt.keyCode === KEY_W) {
        this.props.closeTab(this.props.tabs.findIndex(tab => tab.isActive));
        if (this.props.tabs.length > 0) {
          evt.preventDefault();
        }
      } else if (evt.keyCode === KEY_T) {
        this.onCreateNewTab();
      }
    }
  }

  /**
   * Return the active tab.
   *
   * @returns {Object} The active tab.
   */
  activeTab() {
    return this.props.tabs.find(tab => tab.isActive);
  }

  /**
   * Render the views.
   *
   * @returns {Component} The views.
   */
  renderViews() {
    return this.props.tabs.map((tab) => {
      const viewTabClass = classnames({
        [styles['workspace-view-tab']]: true,
        hidden: !tab.isActive
      });
      return (
        <div
          className={viewTabClass}
          id={tab.id}
          key={tab.id + '-wrap'}
        >
          <Collection
            key={tab.id}
            id={tab.id}
            namespace={tab.namespace}
            isReadonly={tab.isReadonly}
            isTimeSeries={tab.isTimeSeries}
            sourceName={tab.sourceName}
            editViewName={tab.editViewName}
            sourceReadonly={tab.sourceReadonly}
            sourceViewOn={tab.sourceViewOn}
            tabs={tab.tabs}
            views={tab.views}
            scopedModals={tab.scopedModals}
            queryHistoryIndexes={tab.queryHistoryIndexes}
            statsPlugin={tab.statsPlugin}
            statsStore={tab.statsStore}
            activeSubTab={tab.activeSubTab}
            pipeline={tab.pipeline}
            changeActiveSubTab={this.props.changeActiveSubTab}
            selectOrCreateTab={this.props.selectOrCreateTab}
            globalAppRegistry={this.props.appRegistry}
            localAppRegistry={tab.localAppRegistry}
          />
        </div>
      );
    });
  }

  /**
   * Render the Workspace component.
   *
   * @returns {Component} The rendered component.
   */
  render() {
    const selectedTabIndex = this.props.tabs.findIndex((tab) => tab.isActive);

    return (
      <div className={styles.workspace}>
        <WorkspaceTabs
          aria-label="Collection Tabs"
          onCreateNewTab={this.onCreateNewTab}
          onMoveTab={this.props.moveTab}
          onSelectTab={this.props.selectTab}
          onCloseTab={this.props.closeTab}
          tabs={this.props.tabs.map(tab => ({
            title: tab.activeSubTabName,
            subtitle: tab.namespace,
            tabContentId: tab.id,
            renderIcon: (iconProps) => renderTabIcon(
              iconProps,
              getTabType(tab.isTimeSeries, tab.isReadonly)
            )
          }))}
          selectedTabIndex={selectedTabIndex}
        />
        <div className={styles['workspace-views']}>
          {this.renderViews()}
        </div>
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
const mapStateToProps = state => ({
  tabs: state.tabs,
  appRegistry: state.appRegistry
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedWorkspace = connect(
  mapStateToProps,
  {
    createNewTab,
    selectOrCreateTab,
    closeTab,
    prevTab,
    nextTab,
    moveTab,
    selectTab,
    changeActiveSubTab
  }
)(Workspace);

export default MappedWorkspace;
export { Workspace };
