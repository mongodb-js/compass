import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './modify-source-banner.less';

/**
 * The blue banner displayed when modifying a source pipeline.
 *
 * @param {Object} props - The properties.
 *
 * @returns {Component} The react component.
 */
const ModifySourceBanner = (props) => {
  return (
    <div className={classnames(styles['modify-source-banner'])}>
      Modifying pipeline backing "{props.editViewName}"
    </div>
  );
};

ModifySourceBanner.propTypes = {
  editViewName: PropTypes.string.isRequired
};

export default ModifySourceBanner;
