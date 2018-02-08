import React, { PureComponent } from 'react';
import classnames from 'classnames';
import OffCanvasButton from 'components/off-canvas-button';

import styles from './off-canvas.less';

/**
 * Off canvas component.
 */
class OffCanvas extends PureComponent {
  static displayName = 'OffCanvasComponent';

  clickOpenSave = () => {
  }

  /**
   * Render the off canvas component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['off-canvas'])}>
        <OffCanvasButton
          onClick={this.clickOpenSave}
          iconClassName="fa fa-floppy-o"
          isSelected />
      </div>
    );
  }
}

export default OffCanvas;
