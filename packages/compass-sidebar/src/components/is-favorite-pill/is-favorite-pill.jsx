import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import FontAwesome from 'react-fontawesome';

import styles from './is-favorite-pill.less';

/**
 * The component for is favorite pill.
 */
class IsFavoritePill extends PureComponent {
  static displayName = 'IsFavoritePill';
  static propTypes = {
    isSidebarCollapsed: PropTypes.bool.isRequired,
    connectionModel: PropTypes.object.isRequired,
    toggleIsModalVisible: PropTypes.func.isRequired
  }

  /**
   * Shows modal when the favorite pill is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickFavoritePill(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.toggleIsModalVisible(true);
  }

  /**
   * Renders the component.
   *
   * @returns {Component} The component.
   */
  render() {
    if (this.props.isSidebarCollapsed) {
      return null;
    }

    const isFavorite = this.props.connectionModel.connection.isFavorite;
    const fontAwesomeName = isFavorite ? 'star' : 'star-o';
    const hex = this.props.connectionModel.connection.color;
    const style = {
      backgroundColor: hex || '#243642',
      color: isFavorite ? '#ffffff' : '#88989a'
    };

    return (
      <div className={classnames(styles['is-favorite-pill'])}>
        <a
          style={style} className={classnames(styles['is-favorite-pill-text'])}
          onClick={this.clickFavoritePill.bind(this)}>
          <FontAwesome name={fontAwesomeName}/>
          &nbsp;FAVORITE
        </a>
      </div>
    );
  }
}

export default IsFavoritePill;
