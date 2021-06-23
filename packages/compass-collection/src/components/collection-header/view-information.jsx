import React from 'react';
import PropTypes from 'prop-types';

import styles from './collection-header.less';

function ViewInformation({
  sourceName
}) {
  return (
    <div
      className={styles['collection-header-title-readonly-on']}
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
