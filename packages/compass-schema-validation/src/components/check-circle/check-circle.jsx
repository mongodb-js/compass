import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './check-circle.less';

/**
 * The check circle.
 */
class CheckCircle extends Component {
  static displayName = 'CheckCircle';

  /**
   * Render the check circle.
   *
   * @returns {React.Component} The react component.
   */
  render() {
    return (
      <i className={`fa-lg ${classnames(styles['check-circle'])}`} />
    );
  }
}

export default CheckCircle;
