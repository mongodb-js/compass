import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './input-builder.less';

/**
 * Input builder component
 */
class InputBuilder extends PureComponent {
  static displayName = 'InputBuilderComponent';

  /**
   * Render the input builder component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['input-builder'])}>
      </div>
    );
  }
}

export default InputBuilder;
