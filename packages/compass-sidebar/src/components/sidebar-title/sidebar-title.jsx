import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';

import {
  NO_ACTIVE_NAMESPACE,
  changeActiveNamespace
} from '../../modules/databases';
import styles from './sidebar-title.less';

/**
 * The title row in the sidebar.
 */
class SidebarTitle extends PureComponent {
  static displayName = 'SidebarTitleComponent';
  static propTypes = {
    activeNamespace: PropTypes.string.isRequired,
    changeActiveNamespace: PropTypes.func.isRequired,
    connectionModel: PropTypes.object.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired,
    isSidebarCollapsed: PropTypes.bool.isRequired
  };

  /**
   * Handles click on the name in the title.
   */
  clickName = () => {
    this.props.globalAppRegistryEmit('select-instance');

    require('hadron-ipc').call('window:hide-collection-submenu');

    this.props.changeActiveNamespace(NO_ACTIVE_NAMESPACE);
  }

  renderTitle() {
    if (this.props.isSidebarCollapsed) {
      return (
        <FontAwesome
          name="home"
          className={styles['sidebar-title-name-icon']}
        />
      );
    }
    return this.props.connectionModel.connection.name;
  }

  /**
   * Renders the title component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div
        className={classnames(styles['sidebar-title'], {
          [styles['sidebar-title-is-active']]: this.props.activeNamespace === NO_ACTIVE_NAMESPACE
        })}
        onClick={this.clickName}
      >
        <div className={styles['sidebar-title-name']}>
          {this.renderTitle()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  activeNamespace: state.databases.activeNamespace
});

export default connect(
  mapStateToProps,
  {
    changeActiveNamespace
  },
)(SidebarTitle);
export { SidebarTitle };
