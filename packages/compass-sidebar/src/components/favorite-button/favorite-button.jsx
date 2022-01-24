import React from 'react';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';

import styles from './favorite-button.module.less';

const FavoriteButton = ({
  favoriteOptions,
  toggleIsFavoriteModalVisible
}) => {
  /**
   * Shows modal when the favorite pill is clicked.
   *
   * @param {Object} evt - The click event.
   */
  // function clickFavoritePill(evt) {
  //   evt.preventDefault();
  //   evt.stopPropagation();
  //   this.props.toggleIsModalVisible(true);
  // }

  const isFavorite = !!favoriteOptions;
  const fontAwesomeName = isFavorite ? 'star' : 'star-o';
  const hex = favoriteOptions?.color;
  const style = {
    backgroundColor: hex || '#243642',
    color: isFavorite ? '#ffffff' : '#88989a'
  };

  return (
    <div className={styles['favorite-button']}>
      <button
        style={style} className={styles['favorite-button-text']}
        onClick={() => toggleIsFavoriteModalVisible()}
      >
        <FontAwesome name={fontAwesomeName} />
        &nbsp;FAVORITE
      </button>
    </div>
  );
};

FavoriteButton.displayName = 'FavoriteButton';
FavoriteButton.propTypes = {
  // Can be undefined. See ConnectionFavoriteOptions of ConnectionInfo.
  favoriteOptions: PropTypes.object,
  toggleIsFavoriteModalVisible: PropTypes.func.isRequired
};

export default FavoriteButton;
