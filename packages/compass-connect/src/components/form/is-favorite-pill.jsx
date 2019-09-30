import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';
import FavoriteModal from './favorite-modal';
import Actions from 'actions';

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
    savedMessage: PropTypes.string
  }

  /**
   * Show modal when the favorite pill is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickFavoritePill(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Actions.showFavoriteModal();
  }

  /**
   * Render the component.
   *
   * @returns {Component} The component.
   */
  render() {
    const isFavorite = this.props.currentConnection.isFavorite;
    const fontAwesomeName = isFavorite ? 'star' : 'star-o';
    const pillClassName = classnames({
      [styles['is-favorite-pill-text']]: true,
      [styles['is-favorite-pill-filled-no-color']]: isFavorite
    });
    const pillMessClassName = classnames({
      [styles['favorite-saved']]: true,
      [styles['favorite-saved-visible']]: this.props.isMessageVisible
    });

    return (
      <div className={classnames(styles['is-favorite-pill'])}>
        <a className={pillClassName} onClick={this.clickFavoritePill.bind(this)}>
          <FontAwesome name={fontAwesomeName}/>
          &nbsp;FAVORITE
          <div className={pillMessClassName}>{this.props.savedMessage}</div>
        </a>
        <FavoriteModal
          currentConnection={this.props.currentConnection}
          isModalVisible={this.props.isModalVisible} />
      </div>
    );
  }
}

export default IsFavoritePill;
