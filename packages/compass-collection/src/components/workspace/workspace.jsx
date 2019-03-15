import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {
  createTab,
  closeTab,
  selectTab
} from 'modules/tabs';
import CollectionTab from 'components/collection-tab';
import CreateTab from 'components/create-tab';

import styles from './workspace.less';

/**
 * The collection workspace contains tabs of multiple collections.
 */
class Workspace extends PureComponent {
  static displayName = 'Workspace';

  static propTypes = {
    tabs: PropTypes.array.isRequired,
    closeTab: PropTypes.func.isRequired,
    createTab: PropTypes.func.isRequired,
    selectTab: PropTypes.func.isRequired
  };

  /**
   * Get the last namespace in the list.
   *
   * @returns {String} The last namespace in the list.
   */
  lastNamespace() {
    if (this.props.tabs.length > 0) {
      return this.props.tabs[this.props.tabs.length - 1].namespace;
    }
    return '';
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
          subTab="Documents"
          isActive={tab.isActive}
          closeTab={this.props.closeTab}
          selectTab={this.props.selectTab} />
      );
    });
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
          {this.renderTabs()}
          <CreateTab
            createTab={this.props.createTab}
            lastNamespace={this.lastNamespace()}/>
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
    createTab,
    closeTab,
    selectTab
  }
)(Workspace);

export default MappedWorkspace;
export { Workspace };
