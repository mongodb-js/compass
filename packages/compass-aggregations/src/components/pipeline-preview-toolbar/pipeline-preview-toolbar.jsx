import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './pipeline-preview-toolbar.less';

/**
 * The pipeline preview toolbar component.
 */
class PipelinePreviewToolbar extends PureComponent {
  static displayName = 'PipelinePreviewToolbarComponent';

  /**
   * Renders the pipeline preview toolbar.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-preview-toolbar'])}>
      </div>
    );
  }
}

export default PipelinePreviewToolbar;
