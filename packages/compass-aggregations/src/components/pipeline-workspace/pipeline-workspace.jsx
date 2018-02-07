import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './pipeline-workspace.less';

/**
 * The pipeline workspace component.
 */
class PipelineWorkspace extends PureComponent {
  static displayName = 'PipelineWorkspace';

  /**
   * Renders the pipeline workspace.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-workspace'])}>
      </div>
    );
  }
}

export default PipelineWorkspace;
