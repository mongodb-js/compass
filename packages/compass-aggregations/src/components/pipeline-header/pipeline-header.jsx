import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './pipeline-header.less';

/**
 * Displays the pipeline header.
 */
class PipelineHeader extends PureComponent {
  static displayName = 'PipelineHeaderComponent';

  static propTypes = {
    stageAdded: PropTypes.func.isRequired
  }

  /**
   * Render the pipeline header component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles['pipeline-header'])}>
      </div>
    );
  }
}

export default PipelineHeader;
