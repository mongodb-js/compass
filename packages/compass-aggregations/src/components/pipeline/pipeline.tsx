import React, { useEffect } from 'react';
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
import { DEFAULT_SAMPLE_SIZE, DEFAULT_LARGE_LIMIT } from '../../constants';
import type { SavingPipelineModalProps } from '../saving-pipeline-modal/saving-pipeline-modal';
import type { SettingsProps } from '../settings/settings';
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
  Pick<PipelineToolbarProps, 'showRunButton' | 'showExplainButton'> &
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
    // Search indexes polling props
    hasSearchStage: boolean;
    isSearchIndexesSupported: boolean;
    startPollingSearchIndexes: () => void;
    stopPollingSearchIndexes: () => void;
  };

/**
 * Render the pipeline component.
 */
const Pipeline: React.FC<PipelineProps> = ({
  saveCurrentPipeline,
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  clonePipeline,
  showRunButton,
  showExplainButton,
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  isCommenting,
  applySettings,
  settings,
  savingPipeline,
  updateViewError,
  dismissViewError,
  workspace,
  limit = DEFAULT_SAMPLE_SIZE,
  largeLimit = DEFAULT_LARGE_LIMIT,
  enableSearchActivationProgramP1,
  hasSearchStage,
  isSearchIndexesSupported,
  startPollingSearchIndexes,
  stopPollingSearchIndexes,
}) => {
  // Manage search indexes polling based on pipeline content
  useEffect(() => {
    if (!enableSearchActivationProgramP1) {
      return;
    }

    if (!isSearchIndexesSupported) {
      stopPollingSearchIndexes();
      return;
    }

    if (hasSearchStage) {
      startPollingSearchIndexes();
    } else {
      stopPollingSearchIndexes();
    }

    return stopPollingSearchIndexes;
  }, [
    enableSearchActivationProgramP1,
    hasSearchStage,
    isSearchIndexesSupported,
    startPollingSearchIndexes,
    stopPollingSearchIndexes,
  ]);

  const pipelineToolbar = (
    <PipelineToolbar
      showRunButton={showRunButton}
      showExplainButton={showExplainButton}
    />
  );

  const modifyingViewSourceError = updateViewError ? (
    <div className={pipelineErrorBannerContainerStyles}>
      <Banner variant="danger" dismissible onClose={dismissViewError}>
        {updateViewError}
      </Banner>
    </div>
  ) : null;

  const savingPipelineModal = (
    <SavingPipelineModal
      name={savingPipeline.name}
      isOpen={savingPipeline.isOpen}
      isSaveAs={savingPipeline.isSaveAs}
      saveCurrentPipeline={saveCurrentPipeline}
      savingPipelineNameChanged={savingPipelineNameChanged}
      savingPipelineApply={savingPipelineApply}
      savingPipelineCancel={savingPipelineCancel}
      clonePipeline={clonePipeline}
    />
  );

  return (
    <div className={pipelineStyles}>
      <Settings
        isExpanded={settings.isExpanded}
        toggleSettingsIsExpanded={toggleSettingsIsExpanded}
        toggleSettingsIsCommentMode={toggleSettingsIsCommentMode}
        setSettingsSampleSize={setSettingsSampleSize}
        setSettingsLimit={setSettingsLimit}
        isCommenting={isCommenting}
        limit={limit}
        largeLimit={largeLimit}
        applySettings={applySettings}
        settings={settings}
      />
      <WorkspaceContainer toolbar={pipelineToolbar}>
        {modifyingViewSourceError}
        {workspace === 'results' ? (
          <PipelineResultsWorkspace />
        ) : (
          <PipelineBuilderWorkspace />
        )}
        <FocusMode />
        {savingPipelineModal}
      </WorkspaceContainer>
    </div>
  );
};

Pipeline.displayName = 'PipelineComponent';

export default React.memo(Pipeline);
