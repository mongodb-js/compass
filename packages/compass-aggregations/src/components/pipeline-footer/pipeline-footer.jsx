import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './pipeline-footer.less';

/**
 * Displays the pipeline footer.
 */
class PipelineFooter extends PureComponent {
  static displayName = 'PipelineFooterComponent';

  /**
   * Render the pipeline footer component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-footer'])}>
      </div>
    );
  }
}

export default PipelineFooter;
