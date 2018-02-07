import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './stage-builder-toolbar.less';

/**
 * The stage builder toolbar component.
 */
class StageBuilderToolbar extends PureComponent {
  static displayName = 'StageBuilderToolbar';

  /**
   * Renders the stage builder toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-builder-toolbar'])}>
      </div>
    );
  }
}

export default StageBuilderToolbar;
