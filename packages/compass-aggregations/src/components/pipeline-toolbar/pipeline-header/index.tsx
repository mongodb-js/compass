import React from 'react';
import { css, spacing, Body, Icon } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';
import { showSavedPipelines } from '../../../modules/saved-pipeline';
import type { RootState } from '../../../modules';

const containerStyles = css({
  display: 'flex',
  gap: spacing[4],
  alignItems: 'center',
});

const pipelineTextAndOpenStyles = css({
  display: 'flex',
  gap: spacing[2],
});

const openSavedPipelinesStyles = css({
  border: 'none',
  backgroundColor: 'transparent',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
});

const pipelineStagesStyles = css({
  display: 'flex',
  flex: 1,
});

const pipelineActionStyles = css({
  display: 'flex',
  flex: 'none',
  marginLeft: 'auto',
});

type PipelineHeaderProps = {
  isOptionsVisible: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
  onShowSavedPipelines: () => void;
  onToggleOptions: () => void;
  isOpenPipelineVisible: boolean;
};

export const PipelineHeader: React.FunctionComponent<PipelineHeaderProps> = ({
  onShowSavedPipelines,
  showRunButton,
  showExportButton,
  showExplainButton,
  onToggleOptions,
  isOptionsVisible,
  isOpenPipelineVisible,
}) => {
  return (
    <div className={containerStyles} data-testid="pipeline-header">
      {isOpenPipelineVisible && (
        <div className={pipelineTextAndOpenStyles}>
          <Body weight="medium">Pipeline</Body>
          <button
            data-testid="pipeline-toolbar-open-pipelines-button"
            onClick={onShowSavedPipelines}
            className={openSavedPipelinesStyles}
            aria-label="Open saved pipelines"
          >
            <Icon glyph="Folder" />
            <Icon glyph="CaretDown" />
          </button>
        </div>
      )}
      <div className={pipelineStagesStyles}>
        <PipelineStages />
      </div>
      <div className={pipelineActionStyles}>
        <PipelineActions
          onToggleOptions={onToggleOptions}
          isOptionsVisible={isOptionsVisible}
          showRunButton={showRunButton}
          showExportButton={showExportButton}
          showExplainButton={showExplainButton}
        />
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => {
    return {
      isOpenPipelineVisible: !state.editViewName && !state.isAtlasDeployed
    };
  },
  {
    onShowSavedPipelines: showSavedPipelines
  }
)(PipelineHeader);
