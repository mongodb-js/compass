import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './modify-source-banner.less';

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
