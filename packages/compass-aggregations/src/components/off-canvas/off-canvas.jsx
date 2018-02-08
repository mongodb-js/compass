import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './off-canvas.less';

/**
 * Off canvas component.
 */
class OffCanvas extends PureComponent {
  static displayName = 'OffCanvasComponent';

  /**
   * Render the off canvas component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['off-canvas'])}>
      </div>
    );
  }
}

export default OffCanvas;
