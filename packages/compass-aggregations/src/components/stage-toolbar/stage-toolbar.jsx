import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './stage-toolbar.less';

/**
 * The stage toolbar component.
 */
class StageToolbar extends PureComponent {
  static displayName = 'StageToolbar';

  /**
   * Renders the stage toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-toolbar'])}>
      </div>
    );
  }
}

export default StageToolbar;
