import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  LogoMark
} from '@mongodb-js/compass-components';

import {
  NO_ACTIVE_NAMESPACE,
  changeActiveNamespace
} from '../../modules/databases';
import styles from './sidebar-title.module.less';

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
      const isFavorite = this.props.connectionModel.connection.isFavorite;

      return (
        <div
          style={isFavorite ? {
            backgroundColor: this.props.connectionModel.connection.color || 'transparent'
          } : {}}
          className={styles['sidebar-title-logo']}
        >
          <LogoMark
            darkMode
            knockout
          />
        </div>
      );
    }
    return (
      <div className={styles['sidebar-title-name']}>
        {this.props.connectionModel.connection.name}
      </div>
    );
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
        data-test-id="sidebar-title"
        onClick={this.clickName}
      >
        {this.renderTitle()}
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
