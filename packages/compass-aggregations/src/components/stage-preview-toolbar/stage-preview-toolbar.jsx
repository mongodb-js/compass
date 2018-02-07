import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './stage-preview-toolbar.less';

/**
 * The stage preview toolbar component.
 */
class StagePreviewToolbar extends PureComponent {
  static displayName = 'StagePreviewToolbar';

  /**
   * Renders the stage preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-preview-toolbar'])}>
      </div>
    );
  }
}

export default StagePreviewToolbar;
