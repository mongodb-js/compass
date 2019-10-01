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
   * Renders the component.
   *
   * @returns {Component} The component.
   */
  render() {
    const isFavorite = this.props.currentConnection.isFavorite;
    const fontAwesomeName = isFavorite ? 'star' : 'star-o';
    const className = classnames({
      [styles['favorite-saved']]: true,
      [styles['favorite-saved-visible']]: this.props.isMessageVisible
    });
    const color = this.props.currentConnection.color;
    const style = {
      backgroundColor: color || '#dee0e3',
      /* eslint no-nested-ternary: 0 */
      color: color ? '#ffffff' : (isFavorite ? '#243642' : '#88989a')
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
        <FavoriteModal
          currentConnection={this.props.currentConnection}
          isModalVisible={this.props.isModalVisible} />
      </div>
    );
  }
}

export default IsFavoritePill;
