import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import SidebarInstanceStats from '../sidebar-instance-stats';
import SidebarInstanceDetails from '../sidebar-instance-details';
import NonGenuineWarningPill from '../non-genuine-warning-pill';
import IsFavoritePill from '../is-favorite-pill';
import { FavoriteModal } from '@mongodb-js/compass-connect';

import classnames from 'classnames';
import styles from './sidebar-instance.module.less';

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
    connectionModel: PropTypes.object,
    toggleIsModalVisible: PropTypes.func.isRequired,
    isModalVisible: PropTypes.bool.isRequired,
    saveFavorite: PropTypes.func.isRequired
  };

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
    this.props.saveFavorite(this.props.connectionModel.connection, name, color);
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
          connectionModel={this.props.connectionModel.connection}
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
          connectionModel={this.props.connectionModel}
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
