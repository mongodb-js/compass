import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import AddStageButton from 'components/add-stage-button';

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
        <AddStageButton stageAdded={this.props.stageAdded} />
      </div>
    );
  }
}

export default PipelineHeader;
