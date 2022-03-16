/**
 * TODO (@imlucas) Rename -> Aggregation pipeline? Sep ./containers?
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Banner } from '@mongodb-js/compass-components';

import SavePipeline from '../save-pipeline';
import Settings from '../settings';
import LegacyPipelineToolbar from '../legacy-pipeline-toolbar';
import CollationToolbar from './collation-toolbar';
import RestorePipelineModal from './modals/restore-pipeline-modal';
import ImportPipeline from './modals/import-pipeline';
import ConfirmImportPipeline from './modals/confirm-import-pipeline';
import SavingPipelineModal from '../saving-pipeline-modal';
import ConfirmNewPipeline from './modals/confirm-new-pipeline';
import styles from './pipeline.module.less';

import PipelineToolbar from '../pipeline-toolbar';
import PipelineBuilderWorkspace from '../pipeline-builder-workspace';
import PipelineResultsWorkspace from '../pipeline-results-workspace';
import {
  DEFAULT_MAX_TIME_MS,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_LARGE_LIMIT,
} from '../../constants';

/**
 * Displays a pipeline.
 */
class Pipeline extends PureComponent {
  static displayName = 'PipelineComponent';

  static propTypes = {
    allowWrites: PropTypes.bool.isRequired,
    env: PropTypes.string.isRequired,
    isAtlasDeployed: PropTypes.bool.isRequired,
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
    gotoOutResults: PropTypes.func.isRequired,
    gotoMergeResults: PropTypes.func.isRequired,
    name: PropTypes.string,
    dismissViewError: PropTypes.func.isRequired,
    editViewName: PropTypes.string,
    updateView: PropTypes.func.isRequired,
    updateViewError: PropTypes.string,
    importPipelineError: PropTypes.string,
    collation: PropTypes.oneOfType([PropTypes.bool, PropTypes.object]),
    collationChanged: PropTypes.func.isRequired,
    collationString: PropTypes.string,
    collationStringChanged: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    collationCollapseToggled: PropTypes.func.isRequired,
    isCollationExpanded: PropTypes.bool.isRequired,
    isOverviewOn: PropTypes.bool.isRequired,
    toggleOverview: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    toggleSettingsIsExpanded: PropTypes.func.isRequired,
    toggleSettingsIsCommentMode: PropTypes.func.isRequired,
    setSettingsSampleSize: PropTypes.func.isRequired,
    setSettingsMaxTimeMS: PropTypes.func.isRequired,
    setSettingsLimit: PropTypes.func.isRequired,
    limit: PropTypes.number.isRequired,
    largeLimit: PropTypes.number.isRequired,
    maxTimeMS: PropTypes.number.isRequired,
    applySettings: PropTypes.func.isRequired,
    isFullscreenOn: PropTypes.bool.isRequired,
    toggleFullscreen: PropTypes.func.isRequired,
    savingPipelineNameChanged: PropTypes.func.isRequired,
    savingPipelineApply: PropTypes.func.isRequired,
    savingPipelineCancel: PropTypes.func.isRequired,
    savingPipelineOpen: PropTypes.func.isRequired,
    savingPipeline: PropTypes.object.isRequired,
    projections: PropTypes.array.isRequired,
    projectionsChanged: PropTypes.func.isRequired,
    newPipelineFromPaste: PropTypes.func.isRequired,
    openCreateView: PropTypes.func.isRequired,
    isNewPipelineConfirm: PropTypes.bool.isRequired,
    setIsNewPipelineConfirm: PropTypes.func.isRequired,
    inputDocuments: PropTypes.object.isRequired,
    workspace: PropTypes.string.isRequired,
    runOutStage: PropTypes.func.isRequired,
    isTimeSeries: PropTypes.bool.isRequired,
    isReadonly: PropTypes.bool.isRequired,
    sourceName: PropTypes.string.isRequired,
    toggleInputDocumentsCollapsed: PropTypes.func.isRequired,
    refreshInputDocuments: PropTypes.func.isRequired,
  };

  static defaultProps = {
    projections: [],
    maxTimeMS: DEFAULT_MAX_TIME_MS,
    limit: DEFAULT_SAMPLE_SIZE,
    largeLimit: DEFAULT_LARGE_LIMIT,
  };

  /**
   * Render the collation toolbar if neccessary.
   *
   * @returns {Component} The component.
   */
  renderCollationToolbar() {
    // We don't show collation outside toolbar in new implementation.
    // We are using the component in new implementation as well, but inside Toolbar
    if (
      this.props.isCollationExpanded &&
      global?.process?.env?.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR !== 'true'
    ) {
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

  renderModifyingViewSourceError() {
    if (this.props.updateViewError) {
      return (
        <Banner
          variant="danger"
          dismissible
          onClose={this.props.dismissViewError}
        >
          {this.props.updateViewError}
        </Banner>
      );
    }
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
   * Render the saved pipelines box.
   *
   * @returns {Component} The component.
   */
  renderSavePipeline() {
    if (!this.props.isAtlasDeployed) {
      return (
        <SavePipeline
          restorePipelineModalToggle={this.props.restorePipelineModalToggle}
          restorePipelineFrom={this.props.restorePipelineFrom}
          deletePipeline={this.props.deletePipeline}
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          savedPipeline={this.props.savedPipeline}
        />
      );
    }
  }

  renderPipelineToolbar() {
    if (global?.process?.env?.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR !== 'true') {
      return (
        <LegacyPipelineToolbar
          isAtlasDeployed={this.props.isAtlasDeployed}
          savedPipelinesListToggle={this.props.savedPipelinesListToggle}
          updateView={this.props.updateView}
          getSavedPipelines={this.props.getSavedPipelines}
          exportToLanguage={this.props.exportToLanguage}
          saveCurrentPipeline={this.props.saveCurrentPipeline}
          savedPipeline={this.props.savedPipeline}
          newPipelineFromText={this.props.newPipelineFromText}
          clonePipeline={this.props.clonePipeline}
          toggleComments={this.props.toggleComments}
          toggleSample={this.props.toggleSample}
          toggleAutoPreview={this.props.toggleAutoPreview}
          nameChanged={this.props.nameChanged}
          setIsModified={this.props.setIsModified}
          editViewName={this.props.editViewName}
          isModified={this.props.isModified}
          isCommenting={this.props.isCommenting}
          isSampling={this.props.isSampling}
          isAutoPreviewing={this.props.isAutoPreviewing}
          collationCollapseToggled={this.props.collationCollapseToggled}
          isCollationExpanded={this.props.isCollationExpanded}
          name={this.props.name}
          isOverviewOn={this.props.isOverviewOn}
          toggleOverview={this.props.toggleOverview}
          toggleSettingsIsExpanded={this.props.toggleSettingsIsExpanded}
          isFullscreenOn={this.props.isFullscreenOn}
          toggleFullscreen={this.props.toggleFullscreen}
          savingPipelineOpen={this.props.savingPipelineOpen}
          serverVersion={this.props.serverVersion}
          openCreateView={this.props.openCreateView}
          setIsNewPipelineConfirm={this.props.setIsNewPipelineConfirm}
        />
      );
    }
    return <PipelineToolbar />;
  }

  renderPipelineWorkspace() {
    return this.props.workspace === 'results' ? (
      <PipelineResultsWorkspace />
    ) : (
      <PipelineBuilderWorkspace
        allowWrites={this.props.allowWrites}
        editViewName={this.props.editViewName}
        env={this.props.env}
        isTimeSeries={this.props.isTimeSeries}
        isReadonly={this.props.isReadonly}
        sourceName={this.props.sourceName}
        pipeline={this.props.pipeline}
        toggleInputDocumentsCollapsed={this.props.toggleInputDocumentsCollapsed}
        refreshInputDocuments={this.props.refreshInputDocuments}
        stageAdded={this.props.stageAdded}
        setIsModified={this.props.setIsModified}
        openLink={this.props.openLink}
        isCommenting={this.props.isCommenting}
        isAutoPreviewing={this.props.isAutoPreviewing}
        inputDocuments={this.props.inputDocuments}
        runStage={this.props.runStage}
        runOutStage={this.props.runOutStage}
        gotoOutResults={this.props.gotoOutResults}
        gotoMergeResults={this.props.gotoMergeResults}
        serverVersion={this.props.serverVersion}
        stageChanged={this.props.stageChanged}
        stageCollapseToggled={this.props.stageCollapseToggled}
        stageAddedAfter={this.props.stageAddedAfter}
        stageDeleted={this.props.stageDeleted}
        stageMoved={this.props.stageMoved}
        stageOperatorSelected={this.props.stageOperatorSelected}
        stageToggled={this.props.stageToggled}
        fields={this.props.fields}
        isOverviewOn={this.props.isOverviewOn}
        projections={this.props.projections}
        projectionsChanged={this.props.projectionsChanged}
        newPipelineFromPaste={this.props.newPipelineFromPaste}
      />
    );
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
    const confirmNewPipelineModal = (
      <ConfirmNewPipeline
        isNewPipelineConfirm={this.props.isNewPipelineConfirm}
        setIsNewPipelineConfirm={this.props.setIsNewPipelineConfirm}
        newPipeline={this.props.newPipeline}
      />
    );

    const savingPipelineModal = (
      <SavingPipelineModal
        name={this.props.savingPipeline.name}
        isOpen={this.props.savingPipeline.isOpen}
        isSaveAs={this.props.savingPipeline.isSaveAs}
        saveCurrentPipeline={this.props.saveCurrentPipeline}
        savingPipelineNameChanged={this.props.savingPipelineNameChanged}
        savingPipelineApply={this.props.savingPipelineApply}
        savingPipelineCancel={this.props.savingPipelineCancel}
        savingPipelineOpen={this.props.savingPipelineOpen}
        clonePipeline={this.props.clonePipeline}
      />
    );

    return (
      <div
        className={classnames(
          styles.pipeline,
          this.props.isFullscreenOn ? styles['pipeline-fullscreen'] : false
        )}
      >
        {this.renderPipelineToolbar()}
        {this.renderCollationToolbar()}
        {this.renderModifyingViewSourceError()}
        {this.renderPipelineWorkspace()}
        {this.renderSavePipeline()}
        <Settings
          isAtlasDeployed={this.props.isAtlasDeployed}
          isExpanded={this.props.settings.isExpanded}
          toggleSettingsIsExpanded={this.props.toggleSettingsIsExpanded}
          toggleSettingsIsCommentMode={this.props.toggleSettingsIsCommentMode}
          setSettingsSampleSize={this.props.setSettingsSampleSize}
          setSettingsMaxTimeMS={this.props.setSettingsMaxTimeMS}
          setSettingsLimit={this.props.setSettingsLimit}
          isCommenting={this.props.isCommenting}
          toggleComments={this.props.toggleComments}
          limit={this.props.limit}
          largeLimit={this.props.largeLimit}
          maxTimeMS={this.props.maxTimeMS}
          applySettings={this.props.applySettings}
          runStage={this.props.runStage}
          settings={this.props.settings}
        />
        {this.renderRestoreModal()}
        {importPipelineModal}
        {confirmImportPipelineModal}
        {savingPipelineModal}
        {confirmNewPipelineModal}
      </div>
    );
  }
}

export default Pipeline;
