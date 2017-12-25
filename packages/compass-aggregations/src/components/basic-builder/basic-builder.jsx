import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './basic-builder.less';

/**
 * Displays the basic builder.
 */
class BasicBuilder extends PureComponent {
  static displayName = 'BasicBuilderComponent';

  /**
   * Render the basci builder component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['basic-builder'])}>
      </div>
    );
  }
}

export default BasicBuilder;
