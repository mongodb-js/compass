import React from 'react';
import PropTypes from 'prop-types';

import styles from './field-set.less';

function FieldSet({
  children
}) {
  return (
    <fieldset className={styles['field-set']}>
      {children}
    </fieldset>
  );
}

FieldSet.propTypes = {
  children: PropTypes.node.isRequired
};

export default FieldSet;
