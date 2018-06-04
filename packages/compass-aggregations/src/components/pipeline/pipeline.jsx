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
    getPipelineFromIndexedDB: PropTypes.func.isRequired,
    savedPipelinesListToggle: PropTypes.func.isRequired,
    getSavedPipelines: PropTypes.func.isRequired,
    toggleComments: PropTypes.func.isRequired,
    restorePipelineModalToggle: PropTypes.func.isRequired,
    restorePipelineFrom: PropTypes.func.isRequired,
    restorePipeline: PropTypes.object.isRequired,
    deletePipeline: PropTypes.func.isRequired,
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
    copyToClipboard: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    nameChanged: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    setIsModified: PropTypes.func.isRequired,
    name: PropTypes.string
  }

  /**
   * Render the pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const restorePipelineModal = this.props.restorePipeline.isModalVisible
      ? (<RestorePipelineModal
          restorePipelineModalToggle={this.props.restorePipelineModalToggle}
          getPipelineFromIndexedDB={this.props.getPipelineFromIndexedDB}
          restorePipeline={this.props.restorePipeline} />)
      : null;

    return (
      <div className={classnames(styles.pipeline)}>
        <PipelineToolbar
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          getSavedPipelines={this.props.getSavedPipelines}
          copyToClipboard={this.props.copyToClipboard}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          savedPipeline={this.props.savedPipeline}
          newPipeline={this.props.newPipeline}
          clonePipeline={this.props.clonePipeline}
          toggleComments={this.props.toggleComments}
          nameChanged={this.props.nameChanged}
          setIsModified={this.props.setIsModified}
          isModified={this.props.isModified}
          isCommenting={this.props.isCommenting}
          name={this.props.name} />
        <div className={classnames(styles['pipeline-separator'])}></div>
        <PipelineWorkspace {...this.props} />
        <SavePipeline
          restorePipelineModalToggle={this.props.restorePipelineModalToggle}
          restorePipelineFrom={this.props.restorePipelineFrom}
          deletePipeline={this.props.deletePipeline}
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          savedPipeline={this.props.savedPipeline} />
        { restorePipelineModal }
      </div>
    );
  }
}

export default Pipeline;
