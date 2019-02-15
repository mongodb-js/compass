/**
 * TODO (@imlucas) Rename -> Aggregation pipeline? Sep ./containers?
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import PipelineToolbar from 'components/pipeline-toolbar';
import CollationToolbar from './collation-toolbar';
import PipelineWorkspace from 'components/pipeline-workspace';
import SavePipeline from 'components/save-pipeline';
import RestorePipelineModal from './modals/restore-pipeline-modal';
import ImportPipeline from './modals/import-pipeline';
import ConfirmImportPipeline from './modals/confirm-import-pipeline';

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
    toggleSample: PropTypes.func.isRequired,
    toggleAutoPreview: PropTypes.func.isRequired,
    restorePipelineModalToggle: PropTypes.func.isRequired,
    restorePipelineFrom: PropTypes.func.isRequired,
    restorePipeline: PropTypes.object.isRequired,
    deletePipeline: PropTypes.func.isRequired,
    pipeline: PropTypes.array.isRequired,
    serverVersion: PropTypes.string.isRequired,
    stageAdded: PropTypes.func.isRequired,
    stageAddedAfter: PropTypes.func.isRequired,
    stageChanged: PropTypes.func.isRequired,
    stageCollapseToggled: PropTypes.func.isRequired,
    stageDeleted: PropTypes.func.isRequired,
    stageMoved: PropTypes.func.isRequired,
    stageOperatorSelected: PropTypes.func.isRequired,
    stageToggled: PropTypes.func.isRequired,
    savedPipeline: PropTypes.object.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    newPipelineFromText: PropTypes.func.isRequired,
    closeImport: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    changeText: PropTypes.func.isRequired,
    createNew: PropTypes.func.isRequired,
    confirmNew: PropTypes.func.isRequired,
    runStage: PropTypes.func.isRequired,
    importPipelineText: PropTypes.string.isRequired,
    exportToLanguage: PropTypes.func.isRequired,
    fields: PropTypes.array.isRequired,
    nameChanged: PropTypes.func.isRequired,
    isModified: PropTypes.bool.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isSampling: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    isImportPipelineOpen: PropTypes.bool.isRequired,
    isImportConfirmationNeeded: PropTypes.bool.isRequired,
    setIsModified: PropTypes.func.isRequired,
    name: PropTypes.string,
    importPipelineError: PropTypes.string,
    collation: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    collationChanged: PropTypes.func.isRequired,
    collationString: PropTypes.string,
    collationStringChanged: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    collationCollapseToggled: PropTypes.func.isRequired,
    isCollationExpanded: PropTypes.bool.isRequired,
    isOverviewOn: PropTypes.bool.isRequired,
    toggleOverview: PropTypes.func.isRequired
  };

  /**
   * Render global the separator bar.
   *
   * @returns {Component} The component.
   */
  renderSeparator() {
    if (this.props.isCollationExpanded) {
      return (
        <div
          key="expanded-separator"
          className={classnames(styles['pipeline-expanded-separator'])}
        />
      );
    }
    return <div className={classnames(styles['pipeline-separator'])} />;
  }

  /**
   * Render the collation toolbar if neccessary.
   *
   * @returns {Component} The component.
   */
  renderCollationToolbar() {
    if (this.props.isCollationExpanded) {
      return (
        <CollationToolbar
          collation={this.props.collation}
          collationChanged={this.props.collationChanged}
          collationString={this.props.collationString}
          collationStringChanged={this.props.collationStringChanged}
          openLink={this.props.openLink}
        />
      );
    }
    return null;
  }

  /**
   * Render the restore modal if neccessary.
   *
   * @returns {Component} The component.
   */
  renderRestoreModal() {
    if (this.props.restorePipeline.isModalVisible) {
      return (
        <RestorePipelineModal
          restorePipelineModalToggle={this.props.restorePipelineModalToggle}
          getPipelineFromIndexedDB={this.props.getPipelineFromIndexedDB}
          restorePipeline={this.props.restorePipeline}
        />
      );
    }
    return null;
  }

  /**
   * Render the pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const importPipelineModal = (
      <ImportPipeline
        isOpen={this.props.isImportPipelineOpen}
        closeImport={this.props.closeImport}
        changeText={this.props.changeText}
        createNew={this.props.createNew}
        error={this.props.importPipelineError}
        text={this.props.importPipelineText}
      />
    );
    const confirmImportPipelineModal = (
      <ConfirmImportPipeline
        isConfirmationNeeded={this.props.isImportConfirmationNeeded}
        closeImport={this.props.closeImport}
        isAutoPreviewing={this.props.isAutoPreviewing}
        runStage={this.props.runStage}
        confirmNew={this.props.confirmNew}
      />
    );

    return (
      <div className={classnames(styles.pipeline)}>
        <PipelineToolbar
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          getSavedPipelines={this.props.getSavedPipelines}
          exportToLanguage={this.props.exportToLanguage}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          savedPipeline={this.props.savedPipeline}
          newPipeline={this.props.newPipeline}
          newPipelineFromText={this.props.newPipelineFromText}
          clonePipeline={this.props.clonePipeline}
          toggleComments={this.props.toggleComments}
          toggleSample={this.props.toggleSample}
          toggleAutoPreview={this.props.toggleAutoPreview}
          nameChanged={this.props.nameChanged}
          setIsModified={this.props.setIsModified}
          isModified={this.props.isModified}
          isCommenting={this.props.isCommenting}
          isSampling={this.props.isSampling}
          isAutoPreviewing={this.props.isAutoPreviewing}
          collationCollapseToggled={this.props.collationCollapseToggled}
          isCollationExpanded={this.props.isCollationExpanded}
          name={this.props.name}
          isOverviewOn={this.props.isOverviewOn}
          toggleOverview={this.props.toggleOverview}
        />
        {this.renderCollationToolbar()}
        {this.renderSeparator()}
        <PipelineWorkspace {...this.props} />
        <SavePipeline
          restorePipelineModalToggle={this.props.restorePipelineModalToggle}
          restorePipelineFrom={this.props.restorePipelineFrom}
          deletePipeline={this.props.deletePipeline}
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          savedPipeline={this.props.savedPipeline}
        />
        {this.renderRestoreModal()}
        {importPipelineModal}
        {confirmImportPipelineModal}
      </div>
    );
  }
}

export default Pipeline;
