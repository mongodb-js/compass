import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
// import classnames from 'classnames';
// import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import { FavoriteModal } from '@mongodb-js/compass-connect';

import {
  // NO_ACTIVE_NAMESPACE,
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
    isSidebarCollapsed: PropTypes.bool.isRequired,

    toggleIsModalVisible: PropTypes.func.isRequired,
    isModalVisible: PropTypes.bool.isRequired,
    deleteFavorite: PropTypes.func.isRequired,
    saveFavorite: PropTypes.func.isRequired
  };

  /**
   * Handles click on the name in the title.
   */
  // clickName = () => {
  //   this.props.globalAppRegistryEmit('select-instance');

  //   require('hadron-ipc').call('window:hide-collection-submenu');

  //   this.props.changeActiveNamespace(NO_ACTIVE_NAMESPACE);
  // }

  // renderTitle() {
  //   if (this.props.isSidebarCollapsed) {
  //     return (
  //       <FontAwesome
  //         name="home"
  //         className={styles['sidebar-title-name-icon']}
  //       />
  //     );
  //   }
  //   return this.props.connectionModel.connection.name;
  // }


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
          deleteFavorite={this.deleteFavorite.bind(this)}
          closeFavoriteModal={this.closeFavoriteModal.bind(this)}
          saveFavorite={this.saveFavorite.bind(this)}
        />
      );
    }
  }

  /**
   * Renders the title component.
   *
   * @returns {Component} The component.
   */
  render() {
    const isFavorite = this.props.connectionModel.connection.isFavorite;
    const hex = this.props.connectionModel.connection.color;

    return (
      <div
        className={styles['sidebar-title']}
        // onClick={this.clickName}
      >
        {isFavorite && (
          <div
            style={{
              backgroundColor: hex || '#243642',
              width: 5,
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              cursor: 'pointer'
            }}
            onClick={this.props.toggleIsModalVisible}
          />
        )}
        <div className={styles['sidebar-title-name']}>
          {this.props.connectionModel.connection.name}
        </div>
        {this.renderFavoriteModal()}
        <IconButton
          className={styles['sidebar-title-button']}
          // key={node.getId()}
          title="Edit Connection Name"
          aria-label="Edit Connection Name"
          onClick={this.props.toggleIsModalVisible}
        >
          <Icon
            glyph="Edit"
            size="small"
          />
        </IconButton>
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
