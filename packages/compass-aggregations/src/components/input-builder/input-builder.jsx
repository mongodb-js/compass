import React from 'react';
import classnames from 'classnames';

import styles from './input-builder.less';

/**
 * Input builder component.
 *
 * @returns {React.Component} The component.
 */
const InputBuilder = () => {
  return (
    <div className={classnames(styles['input-builder'])}></div>
  );
};

InputBuilder.displayName = 'InputBuilderComponent';

export default InputBuilder;
