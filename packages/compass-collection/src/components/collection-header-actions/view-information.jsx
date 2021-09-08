import React from 'react';
import PropTypes from 'prop-types';

import styles from './collection-header-actions.module.less';

function ViewInformation({
  sourceName
}) {
  return (
    <div
      className={styles['collection-header-actions-readonly-on']}
      title={sourceName}
    >
      view on: {sourceName}
    </div>
  );
}

ViewInformation.propTypes = {
  sourceName: PropTypes.string.isRequired
};

export default ViewInformation;
