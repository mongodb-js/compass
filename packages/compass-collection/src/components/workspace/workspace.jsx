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

import styles from './workspace.less';

/**
 * The collection workspace contains tabs of multiple collections.
 */
class Workspace extends PureComponent {
  static displayName = 'Workspace';

  static propTypes = {
    tabs: PropTypes.array.isRequired
  };

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
          namespace={tab.namespace}
          isActive={tab.isActive} />
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
