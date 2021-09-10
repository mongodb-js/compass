import React from 'react';
import PropTypes from 'prop-types';
import Badge, { Variant as BadgeVariant } from '@leafygreen-ui/badge';

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
    >
      Modifying pipeline backing "{props.editViewName}"
    </Badge>
  );
};

ModifySourceBanner.propTypes = {
  editViewName: PropTypes.string.isRequired
};

export default ModifySourceBanner;
