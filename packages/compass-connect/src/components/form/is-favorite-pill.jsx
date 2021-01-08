import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import Actions from '../../actions';
import FavoriteModal from './favorite-modal';

import styles from '../connect.less';

/**
 * The is favorite pill.
 */
class IsFavoritePill extends PureComponent {
  static displayName = 'IsFavoritePill';

  static propTypes = {
    currentConnection: PropTypes.object,
    isModalVisible: PropTypes.bool,
    isMessageVisible: PropTypes.bool,
    savedMessage: PropTypes.string,
    color: PropTypes.string,
    isFavorite: PropTypes.bool
  }

  /**
   * Deletes the current favorite.
   *
   * @param {Object} connection - The current connection.
   */
  deleteFavorite(connection) {
    Actions.onDeleteConnectionClicked(connection);
    Actions.hideFavoriteModal();
  }

  /**
   * Closes the favorite modal.
   */
  closeFavoriteModal() {
    Actions.hideFavoriteModal();
  }

  /**
   * Saves the current connection to favorites.
   *
   * @param {String} name - The favorite name.
   * @param {String} color - The favorite color.
   */
  saveFavorite(name, color) {
    Actions.onCreateFavoriteClicked(name, color);
    Actions.hideFavoriteModal();
  }

  /**
   * Shows modal when the favorite pill is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickFavoritePill(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.showFavoriteModal();
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
          currentConnection={this.props.currentConnection}
          deleteFavorite={this.deleteFavorite}
          closeFavoriteModal={this.closeFavoriteModal}
          saveFavorite={this.saveFavorite} />
      );
    }
  }

  /**
   * Renders the component.
   *
   * @returns {Component} The component.
   */
  render() {
    const fontAwesomeName = this.props.isFavorite ? 'star' : 'star-o';
    const className = classnames({
      [styles['favorite-saved']]: true,
      [styles['favorite-saved-visible']]: this.props.isMessageVisible
    });
    const style = {
      backgroundColor: this.props.color || '#dee0e3',
      /* eslint no-nested-ternary: 0 */
      color: this.props.color ? '#ffffff' : (this.props.isFavorite ? '#243642' : '#88989a')
    };

    return (
      <div className={classnames(styles['is-favorite-pill'])}>
        <a
          style={style}
          className={classnames(styles['is-favorite-pill-text'])}
          onClick={this.clickFavoritePill.bind(this)}>
          <FontAwesome name={fontAwesomeName}/>
          &nbsp;FAVORITE
          <div className={className}>{this.props.savedMessage}</div>
        </a>
        {this.renderFavoriteModal()}
      </div>
    );
  }
}

export default IsFavoritePill;
