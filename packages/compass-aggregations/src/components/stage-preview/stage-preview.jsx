import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './stage-preview.less';

/**
 * The stage preview component.
 */
class StagePreview extends PureComponent {
  static displayName = 'StagePreview';

  /**
   * Renders the stage preview.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['stage-preview'])}>
      </div>
    );
  }
}

export default StagePreview;
