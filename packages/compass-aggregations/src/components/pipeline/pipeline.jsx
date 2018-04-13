import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PipelineToolbar from 'components/pipeline-toolbar';
import PipelineWorkspace from 'components/pipeline-workspace';
import SavePipeline from 'components/save-pipeline';
import RestorePipelineModal from 'components/restore-pipeline-modal';

import styles from './pipeline.less';

/**
 * Displays a pipeline.
 */
class Pipeline extends PureComponent {
  static displayName = 'PipelineComponent';

  static propTypes = {
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    pipeline: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    restorePipeline: PropTypes.object.isRequired,
    copyToClipboard: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    nameChanged: PropTypes.func.isRequired,
    name: PropTypes.string
  }

  /**
   * Render the pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const savePipeline = this.props.savedPipeline.isListVisible
      ? <SavePipeline {...this.props} />
      : null;
    const restorePipelineModal = this.props.restorePipeline.isModalVisible
      ? <RestorePipelineModal {...this.props} />
      : null;

    return (
      <div className={classnames(styles.pipeline)}>
        <PipelineToolbar
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          getSavedPipelines={this.props.getSavedPipelines}
          stageAdded={this.props.stageAdded}
          copyToClipboard={this.props.copyToClipboard}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          savedPipeline={this.props.savedPipeline}
          newPipeline={this.props.newPipeline}
          clonePipeline={this.props.clonePipeline}
          nameChanged={this.props.nameChanged}
          name={this.props.name} />
        <div className={classnames(styles['pipeline-separator'])}></div>
        <PipelineWorkspace {...this.props} />
        { savePipeline }
        { restorePipelineModal }
      </div>
    );
  }
}

export default Pipeline;
