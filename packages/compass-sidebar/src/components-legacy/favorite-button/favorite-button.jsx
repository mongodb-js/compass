import React from 'react';
import PropTypes from 'prop-types';
import {
  FavoriteIcon,
  mergeProps,
  useFocusRing,
} from '@mongodb-js/compass-components';

import styles from './favorite-button.module.less';

const FavoriteButton = ({ favoriteOptions, toggleIsFavoriteModalVisible }) => {
  const isFavorite = !!favoriteOptions;
  const style = {
    backgroundColor: '#243642',
    color: isFavorite ? '#ffffff' : '#88989a',
  };

  const focusRingProps = useFocusRing({ outer: true, radius: 14 });
  const buttonProps = mergeProps(
    {
      type: 'button',
      'aria-label': 'Edit saved connection',
      title: 'Edit saved connection',
      onClick: () => toggleIsFavoriteModalVisible(),
      className: styles['favorite-button-text'],
      style,
    },
    focusRingProps
  );

  return (
    <div className={styles['favorite-button']}>
      <button {...buttonProps}>
        <FavoriteIcon
          darkMode
          isFavorite={isFavorite}
          favoriteColor="#ffffff"
          showCircle={false}
          size={18}
        />
        FAVORITE
      </button>
    </div>
  );
};

FavoriteButton.displayName = 'FavoriteButton';
FavoriteButton.propTypes = {
  // Can be undefined. See ConnectionFavoriteOptions of ConnectionInfo.
  favoriteOptions: PropTypes.object,
  toggleIsFavoriteModalVisible: PropTypes.func.isRequired,
};

export default FavoriteButton;
