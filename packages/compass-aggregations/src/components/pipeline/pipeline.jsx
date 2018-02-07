import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Toolbar from 'components/toolbar';
import PipelineWorkspace from 'components/pipeline-workspace';

import styles from './pipeline.less';

/**
 * Displays a pipeline.
 */
class Pipeline extends PureComponent {
  static displayName = 'PipelineComponent';

  static propTypes = {
    stages: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    sample: PropTypes.object.isRequired,
    sampleChanged: PropTypes.func.isRequired,
    sampleToggled: PropTypes.func.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    view: PropTypes.string.isRequired,
    fields: PropTypes.array.isRequired
  }

  /**
   * Render the pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.pipeline)}>
        <Toolbar {...this.props} />
        <div className={classnames(styles['pipeline-separator'])}></div>
        <PipelineWorkspace {...this.props} />
      </div>
    );
  }
}

export default Pipeline;
