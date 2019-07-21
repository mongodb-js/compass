import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import styles from './sidebar-title.less';

/**
 * The title row in the sidebar.
 */
class SidebarTitle extends PureComponent {
  static displayName = 'SidebarTitleComponent';
  static propTypes = {
    isSidebarCollapsed: PropTypes.bool.isRequired,
    name: PropTypes.string.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired
  };

  /**
   * Click on the name in the title.
   */
  clickName = () => {
    this.props.globalAppRegistryEmit('select-instance');
    require('hadron-ipc').call('window:hide-collection-submenu');
  }

  renderTitle() {
    if (this.props.isSidebarCollapsed) {
      return (
        <FontAwesome
          name="home"
          className={classnames(styles['sidebar-title-name-icon'])} />
      );
    }
    return this.props.name;
  }

  /**
   * Render the title component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['sidebar-title'])} onClick={this.clickName}>
        <div className={classnames(styles['sidebar-title-name'])}>
          {this.renderTitle()}
        </div>
      </div>
    );
  }
}

export default SidebarTitle;
