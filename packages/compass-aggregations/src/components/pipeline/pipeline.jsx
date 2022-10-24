import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Banner, WorkspaceContainer } from '@mongodb-js/compass-components';

import Settings from '../settings';
import ImportPipeline from './modals/import-pipeline';
import ConfirmImportPipeline from './modals/confirm-import-pipeline';
import SavingPipelineModal from '../saving-pipeline-modal';
import ConfirmNewPipeline from './modals/confirm-new-pipeline';
import styles from './pipeline.module.less';

import PipelineToolbar from '../pipeline-toolbar';
import PipelineExplain from '../pipeline-explain';
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
    isAtlasDeployed: PropTypes.bool.isRequired,
    saveCurrentPipeline: PropTypes.func.isRequired,
    newPipeline: PropTypes.func.isRequired,
    newPipelineFromText: PropTypes.func.isRequired,
    closeImport: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    confirmNew: PropTypes.func.isRequired,
    exportToLanguage: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    isAutoPreviewing: PropTypes.bool.isRequired,
    isImportConfirmationNeeded: PropTypes.bool.isRequired,
    name: PropTypes.string,
    dismissViewError: PropTypes.func.isRequired,
    updateView: PropTypes.func.isRequired,
    updateViewError: PropTypes.string,
    collationString: PropTypes.object,
    collationStringChanged: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired,
    settings: PropTypes.object.isRequired,
    toggleSettingsIsExpanded: PropTypes.func.isRequired,
    toggleSettingsIsCommentMode: PropTypes.func.isRequired,
    setSettingsSampleSize: PropTypes.func.isRequired,
    setSettingsLimit: PropTypes.func.isRequired,
    limit: PropTypes.number.isRequired,
    largeLimit: PropTypes.number.isRequired,
    maxTimeMS: PropTypes.number,
    applySettings: PropTypes.func.isRequired,
    savingPipelineNameChanged: PropTypes.func.isRequired,
    savingPipelineApply: PropTypes.func.isRequired,
    savingPipelineCancel: PropTypes.func.isRequired,
    savingPipelineOpen: PropTypes.func.isRequired,
    savingPipeline: PropTypes.object.isRequired,
    isNewPipelineConfirm: PropTypes.bool.isRequired,
    setIsNewPipelineConfirm: PropTypes.func.isRequired,
    workspace: PropTypes.string.isRequired,
    showExportButton: PropTypes.bool.isRequired,
    showRunButton: PropTypes.bool.isRequired,
    showExplainButton: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    maxTimeMS: DEFAULT_MAX_TIME_MS,
    limit: DEFAULT_SAMPLE_SIZE,
    largeLimit: DEFAULT_LARGE_LIMIT,
  };

  renderModifyingViewSourceError() {
    if (this.props.updateViewError) {
      return (
        <div className={styles['pipeline-error-banner-container']}>
          <Banner
            variant="danger"
            dismissible
            onClose={this.props.dismissViewError}
          >
            {this.props.updateViewError}
          </Banner>
        </div>
      );
    }
  }

  renderPipelineToolbar() {
    return (
      <PipelineToolbar
        showRunButton={this.props.showRunButton}
        showExportButton={this.props.showExportButton}
        showExplainButton={this.props.showExplainButton}
      />
    );
  }

  /**
   * Render the pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const confirmImportPipelineModal = (
      <ConfirmImportPipeline
        isConfirmationNeeded={this.props.isImportConfirmationNeeded}
        closeImport={this.props.closeImport}
        isAutoPreviewing={this.props.isAutoPreviewing}
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
      <div className={styles.pipeline}>
        <Settings
          isAtlasDeployed={this.props.isAtlasDeployed}
          isExpanded={this.props.settings.isExpanded}
          toggleSettingsIsExpanded={this.props.toggleSettingsIsExpanded}
          toggleSettingsIsCommentMode={this.props.toggleSettingsIsCommentMode}
          setSettingsSampleSize={this.props.setSettingsSampleSize}
          setSettingsLimit={this.props.setSettingsLimit}
          isCommenting={this.props.isCommenting}
          limit={this.props.limit}
          largeLimit={this.props.largeLimit}
          maxTimeMS={this.props.maxTimeMS}
          applySettings={this.props.applySettings}
          settings={this.props.settings}
        />
        <WorkspaceContainer toolbar={this.renderPipelineToolbar()}>
          {this.renderModifyingViewSourceError()}
          {this.props.workspace === 'results' ? (
            <PipelineResultsWorkspace />
          ) : (
            <PipelineBuilderWorkspace />
          )}
          <PipelineExplain />
          <ImportPipeline />
          {confirmImportPipelineModal}
          {savingPipelineModal}
          {confirmNewPipelineModal}
        </WorkspaceContainer>
      </div>
    );
  }
}

export default Pipeline;
