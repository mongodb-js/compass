import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  MoreOptionsToggle,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import {
  exportAggregationResults,
  runAggregation,
} from '../../../modules/aggregation';
import { updateView } from '../../../modules/update-view';
import { explainAggregation } from '../../../modules/explain';
import { getIsPipelineValidFromBuilderState, getPipelineStageOperatorsFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

type PipelineActionsProps = {
  showRunButton?: boolean;
  isRunButtonDisabled?: boolean;
  onRunAggregation: () => void;

  showExportButton?: boolean;
  isExportButtonDisabled?: boolean;
  onExportAggregationResults: () => void;

  showUpdateViewButton?: boolean;
  isUpdateViewButtonDisabled?: boolean;
  onUpdateView: () => void;

  showExplainButton?: boolean;
  isExplainButtonDisabled?: boolean;
  onExplainAggregation: () => void;

  isOptionsVisible?: boolean;
  onToggleOptions: () => void;
};

export const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  isOptionsVisible,
  showRunButton,
  isRunButtonDisabled,
  showExportButton,
  isExportButtonDisabled,
  showUpdateViewButton,
  isUpdateViewButtonDisabled,
  isExplainButtonDisabled,
  showExplainButton,
  onUpdateView,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
  onExplainAggregation,
}) => {
  return (
    <div className={containerStyles}>
      {showUpdateViewButton && (
        <Button
          aria-label="Update view"
          data-testid="pipeline-toolbar-update-view-aggregation-button"
          variant="primary"
          size="small"
          onClick={onUpdateView}
          disabled={isUpdateViewButtonDisabled}
        >
          Update view
        </Button>
      )}
      {showExplainButton && (
        <Button
          aria-label="Explain aggregation"
          data-testid="pipeline-toolbar-explain-aggregation-button"
          variant="default"
          size="small"
          onClick={onExplainAggregation}
          disabled={isExplainButtonDisabled}
        >
          Explain
        </Button>
      )}
      {!showUpdateViewButton && showExportButton && (
        <Button
          aria-label="Export aggregation"
          data-testid="pipeline-toolbar-export-aggregation-button"
          variant="default"
          size="small"
          onClick={onExportAggregationResults}
          disabled={isExportButtonDisabled}
        >
          Export
        </Button>
      )}
      {!showUpdateViewButton && showRunButton && (
        <Button
          aria-label="Run aggregation"
          data-testid="pipeline-toolbar-run-button"
          variant="primary"
          size="small"
          onClick={onRunAggregation}
          disabled={isRunButtonDisabled}
        >
          Run
        </Button>
      )}
      <MoreOptionsToggle
        isExpanded={!!isOptionsVisible}
        aria-controls="pipeline-options"
        id="pipeline-toolbar-options"
        data-testid="pipeline-toolbar-options-button"
        onToggleOptions={onToggleOptions}
      />
    </div>
  );
};

const mapState = (state: RootState) => {
  const resultPipeline = getPipelineStageOperatorsFromBuilderState(state);
  const lastStage = resultPipeline[resultPipeline.length - 1];
  const isMergeOrOutPipeline = ['$merge', '$out'].includes(lastStage);
  const isPipelineInvalid = getIsPipelineValidFromBuilderState(state);
  const isStageStateEmpty = resultPipeline.length === 0;

  return {
    isRunButtonDisabled: isPipelineInvalid || isStageStateEmpty,
    isExplainButtonDisabled: isPipelineInvalid,
    isExportButtonDisabled:
      isMergeOrOutPipeline || isPipelineInvalid || isStageStateEmpty,
    showUpdateViewButton: Boolean(state.editViewName),
    isUpdateViewButtonDisabled:
      !state.isModified || isPipelineInvalid || isStageStateEmpty,
  };
};

const mapDispatch = {
  onUpdateView: updateView,
  onRunAggregation: runAggregation,
  onExportAggregationResults: exportAggregationResults,
  onExplainAggregation: explainAggregation,
};

export default connect(mapState, mapDispatch)(React.memo(PipelineActions));
