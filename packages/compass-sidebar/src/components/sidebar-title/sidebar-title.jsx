import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { connect } from 'react-redux';
import {
  MongoDBLogoMark
} from '@mongodb-js/compass-components';

import { NO_ACTIVE_NAMESPACE } from '../../modules/databases';
import styles from './sidebar-title.module.less';

/**
 * The title row in the sidebar.
 */
class SidebarTitle extends PureComponent {
  static displayName = 'SidebarTitleComponent';

  static propTypes = {
    activeNamespace: PropTypes.string.isRequired,
    connectionModel: PropTypes.object.isRequired,
    isSidebarExpanded: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  };

  renderTitle() {
    if (this.props.isSidebarExpanded) {
      return (
        <div className={styles['sidebar-title-name']}>
          {this.props.connectionModel.connection.name}
        </div>
      );
    }

    const isFavorite = this.props.connectionModel.connection.isFavorite;

    return (
      <div
        style={isFavorite ? {
          backgroundColor: this.props.connectionModel.connection.color || 'transparent'
        } : {}}
        className={styles['sidebar-title-logo']}
      >
        <MongoDBLogoMark
          color="white"
        />
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
        onClick={this.props.onClick}
      >
        {this.renderTitle()}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  activeNamespace: state.databases.activeNamespace
});

export default connect(mapStateToProps)(SidebarTitle);
export { SidebarTitle };
