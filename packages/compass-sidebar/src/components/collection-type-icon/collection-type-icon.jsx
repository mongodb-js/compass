
import React from 'react';
import PropTypes from 'prop-types';
import Icon from '@leafygreen-ui/icon';

import { TIME_SERIES_COLLECTION_TYPE } from '../../modules/collection';

import styles from './collection-type-icon.module.less';

const VIEW_COLLECTION_TYPE = 'view';

function CollectionTypeIcon({
  collectionType
}) {
  if (collectionType === TIME_SERIES_COLLECTION_TYPE) {
    return (
      <Icon
        className={styles['compass-sidebar-collection-type-icon']}
        glyph="TimeSeries"
        title="Time-Series Collection"
      />
    );
  }

  if (collectionType === VIEW_COLLECTION_TYPE) {
    return (
      <Icon
        className={styles['compass-sidebar-collection-type-icon']}
        glyph="Visibility"
        title="Read-only View"
      />
    );
  }

  return (
    <Icon
      className={styles['compass-sidebar-collection-type-icon']}
      glyph="Folder"
      title="Collection"
    />
  );
}

CollectionTypeIcon.propTypes = {
  collectionType: PropTypes.string.isRequired
};

export default CollectionTypeIcon;
