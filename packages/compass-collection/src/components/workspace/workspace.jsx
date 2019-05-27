import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { IconButton } from 'hadron-react-buttons';
import { WithDragDropContext } from 'hadron-react-components';
import {
  preCreateTab,
  closeTab,
  prevTab,
  nextTab,
  moveTab,
  selectTab
} from 'modules/tabs';
import CollectionTab from 'components/collection-tab';
import CreateTab from 'components/create-tab';
import Collection from 'components/collection';

import styles from './workspace.less';

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

/**
 * The collection workspace contains tabs of multiple collections.
 */
class Workspace extends PureComponent {
  static displayName = 'Workspace';

  static propTypes = {
    tabs: PropTypes.array.isRequired,
    closeTab: PropTypes.func.isRequired,
    preCreateTab: PropTypes.func.isRequired,
    prevTab: PropTypes.func.isRequired,
    nextTab: PropTypes.func.isRequired,
    moveTab: PropTypes.func.isRequired,
    selectTab: PropTypes.func.isRequired
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

  /**
   * Handle key press. This listens for CTRL/CMD+T and CTRL/CMD+W to control
   * natural opening and closing of collection tabs. CTRL/CMD+SHIFT+] and
   * CTRL/CMD+SHIFT+[ to go forward and backwards through the tabs.
   *
   * @param {Event} evt - The event.
   */
  handleKeypress(evt) {
    if (evt.ctrlKey || evt.metaKey) {
      if (evt.shiftKey) {
        if (evt.keyCode === KEY_CLOSE_BRKT) {
          this.props.nextTab();
        } else if (evt.keyCode === KEY_OPEN_BRKT) {
          this.props.prevTab();
        }
      } else {
        if (evt.keyCode === KEY_W) {
          this.props.closeTab(this.props.tabs.findIndex(tab => tab.isActive));
          if (this.props.tabs.length > 0) {
            evt.preventDefault();
          }
        } else if (evt.keyCode === KEY_T) {
          this.props.preCreateTab(this.activeNamespace());
        }
      }
    }
  }

  /**
   * Get the active namespace in the list.
   *
   * @returns {String} The active namespace in the list.
   */
  activeNamespace() {
    const activeTab = this.props.tabs.find(tab => tab.isActive);
    return activeTab ? activeTab.namespace : '';
  }

  /**
   * Render the tabs.
   *
   * @returns {Component} The component.
   */
  renderTabs() {
    return this.props.tabs.map((tab, i) => {
      return (
        <CollectionTab
          key={i}
          index={i}
          namespace={tab.namespace}
          localAppRegistry={tab.localAppRegistry}
          isActive={tab.isActive}
          closeTab={this.props.closeTab}
          selectTab={this.props.selectTab}
          moveTab={this.props.moveTab} />
      );
    });
  }

  /**
   * Render the views.
   *
   * @returns {Component} The views.
   */
  renderViews() {
    const activeTab = this.props.tabs.find((tab) => {
      return tab.isActive;
    });
    if (activeTab) {
      return (
        <Collection
          key={activeTab.id}
          namespace={activeTab.namespace}
          isReadonly={activeTab.isReadonly}
          tabs={activeTab.tabs}
          views={activeTab.views}
          queryHistoryIndexes={activeTab.queryHistoryIndexes}
          statsPlugin={activeTab.statsPlugin}
          statsStore={activeTab.statsStore}
          localAppRegistry={activeTab.localAppRegistry} />
      );
    }
  }

  /**
   * Render the Workspace component.
   *
   * @returns {Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.workspace)}>
        <div className={classnames(styles['workspace-tabs'])}>
          <div onClick={this.props.prevTab} className={classnames(styles['workspace-tabs-prev'])}>
            <i className="fa fa-chevron-left" aria-hidden/>
          </div>
          <div className={classnames(styles['workspace-tabs-container'])}>
            {this.renderTabs()}
            <CreateTab
              createTab={this.props.preCreateTab}
              activeNamespace={this.activeNamespace()}/>
          </div>
          <div onClick={this.props.nextTab} className={classnames(styles['workspace-tabs-next'])}>
            <i className="fa fa-chevron-right" aria-hidden/>
          </div>
        </div>
        <div className={classnames(styles['workspace-views'])}>
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
  tabs: state.tabs
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedWorkspace = connect(
  mapStateToProps,
  {
    preCreateTab,
    closeTab,
    prevTab,
    nextTab,
    moveTab,
    selectTab
  }
)(Workspace);

export default WithDragDropContext(MappedWorkspace);
export { Workspace };
