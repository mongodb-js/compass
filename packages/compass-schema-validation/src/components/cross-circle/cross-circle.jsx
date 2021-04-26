import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './cross-circle.less';

/**
 * The cross circle.
 */
class CrossCircle extends Component {
  static displayName = 'CrossCircle';

  /**
   * Render the cross circle.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <i className={`fa-lg ${classnames(styles['cross-circle'])}`} />
    );
  }
}

export default CrossCircle;
