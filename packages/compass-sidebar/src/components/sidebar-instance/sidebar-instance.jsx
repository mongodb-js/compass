import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import SidebarInstanceStats from 'components/sidebar-instance-stats';
import SidebarInstanceDetails from 'components/sidebar-instance-details';
import NonGenuineWarningPill from 'components/non-genuine-warning-pill';
import IsFavoritePill from 'components/is-favorite-pill';
import { FavoriteModal } from '@mongodb-js/compass-connect';

import classnames from 'classnames';
import styles from './sidebar-instance.less';

class SidebarInstance extends PureComponent {
  static displayName = 'SidebarInstance';
  static propTypes = {
    instance: PropTypes.object,
    isExpanded: PropTypes.bool.isRequired,
    isSidebarCollapsed: PropTypes.bool.isRequired,
    isGenuineMongoDB: PropTypes.bool.isRequired,
    toggleIsDetailsExpanded: PropTypes.func.isRequired,
    globalAppRegistryEmit: PropTypes.func.isRequired,
    detailsPlugins: PropTypes.array.isRequired,
    connection: PropTypes.object,
    toggleIsModalVisible: PropTypes.func.isRequired,
    isModalVisible: PropTypes.bool.isRequired,
    deleteFavorite: PropTypes.func.isRequired,
    saveFavorite: PropTypes.func.isRequired
  };

  /**
   * Deletes the current favorite.
   *
   * @param {Object} connection - The current connection.
   */
  deleteFavorite(connection) {
    this.props.deleteFavorite(connection);
    this.props.toggleIsModalVisible(false);
    global.hadronApp.appRegistry.emit('clear-current-favorite');
  }

  /**
   * Closes the favorite modal.
   */
  closeFavoriteModal() {
    this.props.toggleIsModalVisible(false);
  }

  /**
   * Saves the current connection to favorites.
   *
   * @param {String} name - The favorite name.
   * @param {String} color - The favorite color.
   */
  saveFavorite(name, color) {
    this.props.saveFavorite(this.props.connection, name, color);
    this.props.toggleIsModalVisible(false);
  }

  /**
   * Renders the favorite modal.
   *
   * @returns {React.Component}
   */
  renderFavoriteModal() {
    if (this.props.isModalVisible) {
      return (
        <FavoriteModal
          currentConnection={this.props.connection}
          deleteFavorite={this.deleteFavorite.bind(this)}
          closeFavoriteModal={this.closeFavoriteModal.bind(this)}
          saveFavorite={this.saveFavorite.bind(this)} />
      );
    }
  }

  /**
   * Renders the SidebarInstance component.
   *
   * @returns {React.Component}
   */
  render() {
    return (
      <div className={classnames(styles['sidebar-instance'])}>
        <SidebarInstanceStats
          instance={this.props.instance}
          isExpanded={this.props.isExpanded}
          toggleIsExpanded={this.props.toggleIsDetailsExpanded}
          globalAppRegistryEmit={this.props.globalAppRegistryEmit} />
        <IsFavoritePill
          isSidebarCollapsed={this.props.isSidebarCollapsed}
          connection={this.props.connection}
          toggleIsModalVisible={this.props.toggleIsModalVisible} />
        {this.renderFavoriteModal()}
        <NonGenuineWarningPill
          isSidebarCollapsed={this.props.isSidebarCollapsed}
          isGenuineMongoDB={this.props.isGenuineMongoDB} />
        <SidebarInstanceDetails
          detailsPlugins={this.props.detailsPlugins}
          isSidebarCollapsed={this.props.isSidebarCollapsed}
          isExpanded={this.props.isExpanded} />
      </div>
    );
  }
}

export default SidebarInstance;
