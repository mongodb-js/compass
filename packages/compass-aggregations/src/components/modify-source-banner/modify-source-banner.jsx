import React from 'react';
import PropTypes from 'prop-types';
import { Badge, BadgeVariant } from '@mongodb-js/compass-components';

import styles from './modify-source-banner.module.less';

/**
 * The blue banner displayed when modifying a source pipeline.
 *
 * @param {Object} props - The properties.
 *
 * @returns {Component} The react component.
 */
const ModifySourceBanner = (props) => {
  return (
    <Badge
      className={styles['modify-source-banner']}
      variant={BadgeVariant.Blue}
      data-testid="modify-source-banner"
    >
      Modifying pipeline backing &quot;{props.editViewName}&quot;
    </Badge>
  );
};

ModifySourceBanner.propTypes = {
  editViewName: PropTypes.string.isRequired
};

export default ModifySourceBanner;
