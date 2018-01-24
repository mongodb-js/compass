import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { CODE } from 'modules/view';
import BasicBuilder from 'components/basic-builder';
import AdvancedBuilder from 'components/advanced-builder';
import PipelineHeader from 'components/pipeline-header';
import PipelineFooter from 'components/pipeline-footer';

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
    const builder = this.props.view === CODE ?
      <AdvancedBuilder {...this.props } /> :
      <BasicBuilder {...this.props} />;
    return (
      <div className={classnames(styles.pipeline)}>
        <PipelineHeader {...this.props} />
        {builder}
        <PipelineFooter {...this.props} />
      </div>
    );
  }
}

export default Pipeline;
