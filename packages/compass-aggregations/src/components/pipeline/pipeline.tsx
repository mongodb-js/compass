import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import {
  Banner,
  WorkspaceContainer,
  css,
} from '@mongodb-js/compass-components';

import Settings from '../settings';
import SavingPipelineModal from '../saving-pipeline-modal';

import type { PipelineToolbarProps } from '../pipeline-toolbar';
import PipelineToolbar from '../pipeline-toolbar';
import PipelineBuilderWorkspace from '../pipeline-builder-workspace';
import PipelineResultsWorkspace from '../pipeline-results-workspace';
import FocusMode from '../focus-mode/focus-mode';
import {
  DEFAULT_MAX_TIME_MS,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_LARGE_LIMIT,
} from '../../constants';
import type { SavingPipelineModalProps } from '../saving-pipeline-modal/saving-pipeline-modal';
import type { SettingsProps } from '../settings/settings';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';
import type { Workspace } from '../../modules/workspace';

const pipelineStyles = css({
  display: 'flex',
  flexGrow: 1,
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  minHeight: 0,
  position: 'relative',
});

const pipelineErrorBannerContainerStyles = css({
  marginLeft: '20px',
  marginRight: '36px',
});

/**
 * Displays a pipeline.
 */
export type PipelineProps = Pick<
  SavingPipelineModalProps,
  | 'saveCurrentPipeline'
  | 'savingPipelineNameChanged'
  | 'savingPipelineApply'
  | 'savingPipelineCancel'
  | 'clonePipeline'
> &
  Pick<
    PipelineToolbarProps,
    'showRunButton' | 'showExportButton' | 'showExplainButton'
  > &
  Pick<
    SettingsProps,
    | 'toggleSettingsIsExpanded'
    | 'toggleSettingsIsCommentMode'
    | 'setSettingsSampleSize'
    | 'setSettingsLimit'
    | 'isCommenting'
    | 'applySettings'
    | 'settings'
  > & {
    savingPipeline: Pick<
      SavingPipelineModalProps,
      'name' | 'isOpen' | 'isSaveAs'
    >;
    updateViewError?: string | null;
    dismissViewError: () => void;
    workspace: Workspace;
    settings: { isExpanded: boolean };
    limit?: number;
    maxTimeMS?: number | null;
    largeLimit?: number;
    enableSearchActivationProgramP1: boolean;
  };
class Pipeline extends PureComponent<
  PipelineProps,
  { pipelineOutputOption: PipelineOutputOption }
> {
  static displayName = 'PipelineComponent';

  static propTypes = {
    saveCurrentPipeline: PropTypes.func.isRequired,
    clonePipeline: PropTypes.func.isRequired,
    isCommenting: PropTypes.bool.isRequired,
    name: PropTypes.string,
    dismissViewError: PropTypes.func.isRequired,
    updateViewError: PropTypes.string,
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
    savingPipeline: PropTypes.object.isRequired,
    workspace: PropTypes.string.isRequired,
    showExportButton: PropTypes.bool.isRequired,
    showRunButton: PropTypes.bool.isRequired,
    showExplainButton: PropTypes.bool.isRequired,
    enableSearchActivationProgramP1: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    maxTimeMS: DEFAULT_MAX_TIME_MS,
    limit: DEFAULT_SAMPLE_SIZE,
    largeLimit: DEFAULT_LARGE_LIMIT,
  };

  renderModifyingViewSourceError() {
    if (this.props.updateViewError) {
      return (
        <div className={pipelineErrorBannerContainerStyles}>
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
    const savingPipelineModal = (
      <SavingPipelineModal
        name={this.props.savingPipeline.name}
        isOpen={this.props.savingPipeline.isOpen}
        isSaveAs={this.props.savingPipeline.isSaveAs}
        saveCurrentPipeline={this.props.saveCurrentPipeline}
        savingPipelineNameChanged={this.props.savingPipelineNameChanged}
        savingPipelineApply={this.props.savingPipelineApply}
        savingPipelineCancel={this.props.savingPipelineCancel}
        clonePipeline={this.props.clonePipeline}
      />
    );

    return (
      <div className={pipelineStyles}>
        <Settings
          isExpanded={this.props.settings.isExpanded}
          toggleSettingsIsExpanded={this.props.toggleSettingsIsExpanded}
          toggleSettingsIsCommentMode={this.props.toggleSettingsIsCommentMode}
          setSettingsSampleSize={this.props.setSettingsSampleSize}
          setSettingsLimit={this.props.setSettingsLimit}
          isCommenting={this.props.isCommenting}
          limit={this.props.limit!}
          largeLimit={this.props.largeLimit!}
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
          <FocusMode />
          {savingPipelineModal}
        </WorkspaceContainer>
      </div>
    );
  }
}

export default Pipeline;
