import React from 'react';
import PropTypes from 'prop-types';

import styles from './field-set.module.less';

function FieldSet({
  dataTestId,
  children
}) {
  return (
    <fieldset className={styles['field-set']} data-testid={dataTestId}>
      {children}
    </fieldset>
  );
}

FieldSet.propTypes = {
  dataTestId: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default FieldSet;
