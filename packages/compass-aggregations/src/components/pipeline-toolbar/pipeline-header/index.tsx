import React, { useCallback } from 'react';
import {
  Body,
  Icon,
  InteractivePopover,
  css,
  cx,
  focusRingVisibleStyles,
  focusRingStyles,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';
import {
  setShowSavedPipelines,
  showSavedPipelines
} from '../../../modules/saved-pipeline';
import {
  restorePipelineModalToggle,
  restorePipelineFrom
} from '../../../modules/restore-pipeline';
import { SavedPipelines } from '../../saved-pipelines/saved-pipelines';
import {
  deletePipeline,
} from '../../../modules';
import type { RootState } from '../../../modules';
import type { Pipeline } from '../../../modules/pipeline';

const containerStyles = css({
  display: 'flex',
  gap: spacing[4],
  alignItems: 'center',
});

const pipelineTextAndOpenStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const openSavedPipelinesStyles = cx(
  css({
    border: 'none',
    backgroundColor: 'transparent',
    display: 'inline-flex',
    alignItems: 'center',
    padding: spacing[2] - 2, // -2px for border.
    '&:hover': {
      cursor: 'pointer',
    },
    '&:focus': focusRingVisibleStyles,
  }),
  focusRingStyles
);

const pipelineStagesStyles = css({
  display: 'flex',
  flex: 1,
});

const pipelineActionStyles = css({
  display: 'flex',
  flex: 'none',
  marginLeft: 'auto',
});

const savedAggregationsPopoverStyles = css({
  // We want the popover to open almost to the shell at the bottom of Compass.
  maxHeight: 'calc(100vh - 270px)',
  display: 'flex',
  marginLeft: -spacing[2] - 1, // Align to the left of the bar.
});

type PipelineHeaderProps = {
  deletePipeline: (pipelineId: string) => void;
  isOptionsVisible: boolean;
  namespace: string;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
  onShowSavedPipelines: () => void;
  onSetShowSavedPipelines: (show: boolean) => void;
  onToggleOptions: () => void;
  isOpenPipelineVisible: boolean;
  isSavedPipelineVisible: boolean;
  restorePipelineFrom: (pipelineId: string) => void;
  restorePipelineModalToggle: (index: number) => void;
  savedPipelines: Pipeline[];
};

export const PipelineHeader: React.FunctionComponent<PipelineHeaderProps> = ({
  deletePipeline,
  namespace,
  onShowSavedPipelines,
  showRunButton,
  showExportButton,
  showExplainButton,
  onToggleOptions,
  onSetShowSavedPipelines,
  isOptionsVisible,
  isOpenPipelineVisible,
  isSavedPipelineVisible,
  restorePipelineFrom,
  restorePipelineModalToggle,
  savedPipelines,
}) => {
  const savedPipelinesPopover = () => (
    <SavedPipelines
      namespace={namespace}
      restorePipelineModalToggle={restorePipelineModalToggle}
      restorePipelineFrom={restorePipelineFrom}
      deletePipeline={deletePipeline}
      onSetShowSavedPipelines={onSetShowSavedPipelines}
      savedPipelines={savedPipelines}
    />
  );

  const onSetShowSavedPipelinesCallback = useCallback((showSavedPipelines: boolean) => {
    if (showSavedPipelines) {
      return onShowSavedPipelines();
    }
    onSetShowSavedPipelines(false);
  }, [ onShowSavedPipelines, onSetShowSavedPipelines ]);

  return (
    <div className={containerStyles} data-testid="pipeline-header">
      {isOpenPipelineVisible && (
        <InteractivePopover
          className={savedAggregationsPopoverStyles}
          trigger={({ onClick, ref, children }) => (
            <div className={pipelineTextAndOpenStyles}>
              <Body weight="medium">Pipeline</Body>
              <button
                data-testid="pipeline-toolbar-open-pipelines-button"
                onClick={onClick}
                className={openSavedPipelinesStyles}
                aria-label="Open saved pipelines"
                aria-haspopup="true"
                aria-expanded={isSavedPipelineVisible ? true : undefined}
                type="button"
                ref={ref}
              >
                <Icon glyph="Folder" />
                <Icon glyph="CaretDown" />
              </button>
              {children}
            </div>
          )}
          open={isSavedPipelineVisible}
          setOpen={onSetShowSavedPipelinesCallback}
        >
          {savedPipelinesPopover}
        </InteractivePopover>
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
      isOpenPipelineVisible: !state.editViewName && !state.isAtlasDeployed,
      isSavedPipelineVisible: state.savedPipeline.isListVisible,
      namespace: state.namespace,
      savedPipelines: state.savedPipeline.pipelines,
    };
  },
  {
    deletePipeline,
    restorePipelineFrom,
    restorePipelineModalToggle,
    onShowSavedPipelines: showSavedPipelines,
    onSetShowSavedPipelines: setShowSavedPipelines
  }
)(PipelineHeader);
