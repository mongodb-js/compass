import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './stage-workspace.less';

/**
 * The stage workspace component.
 */
class StageWorkspace extends PureComponent {
  static displayName = 'StageWorkspace';

  /**
   * Renders the stage workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-workspace'])}>
      </div>
    );
  }
}

export default StageWorkspace;
