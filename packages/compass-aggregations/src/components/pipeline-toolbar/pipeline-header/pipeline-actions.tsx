import React from 'react';
import { connect } from 'react-redux';
import {
  AIExperienceEntry,
  Button,
  MoreOptionsToggle,
  PerformanceSignals,
  SignalPopover,
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
import {
  getIsPipelineInvalidFromBuilderState,
  getPipelineStageOperatorsFromBuilderState,
} from '../../../modules/pipeline-builder/builder-helpers';
import { isOutputStage } from '../../../utils/stage';
import { openCreateIndexModal } from '../../../modules/insights';
import { usePreference } from 'compass-preferences-model';
import { showInput as showAIInput } from '../../../modules/pipeline-builder/pipeline-ai';

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

  isAtlasDeployed?: boolean;

  showAIEntry: boolean;
  onShowAIInputClick: () => void;

  showCollectionScanInsight?: boolean;
  onCollectionScanInsightActionButtonClick: () => void;
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
  showAIEntry,
  onShowAIInputClick,
  onUpdateView,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
  onExplainAggregation,
  isAtlasDeployed,
  showCollectionScanInsight,
  onCollectionScanInsightActionButtonClick,
}) => {
  const showInsights = usePreference('showInsights', React);
  const enableAIExperience = usePreference('enableAIExperience', React);
  const isAIFeatureEnabled = usePreference('enableAI', React);

  return (
    <div className={containerStyles}>
      {enableAIExperience && showAIEntry && isAIFeatureEnabled && (
        <AIExperienceEntry onClick={onShowAIInputClick} />
      )}
      {showInsights && showCollectionScanInsight && (
        <div>
          <SignalPopover
            signals={{
              ...PerformanceSignals.get('aggregation-executed-without-index'),
              onPrimaryActionButtonClick:
                onCollectionScanInsightActionButtonClick,
            }}
          ></SignalPopover>
        </div>
      )}
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
      {!isAtlasDeployed && (
        <MoreOptionsToggle
          isExpanded={!!isOptionsVisible}
          aria-controls="pipeline-options"
          id="pipeline-toolbar-options"
          data-testid="pipeline-toolbar-options-button"
          onToggleOptions={onToggleOptions}
        />
      )}
    </div>
  );
};

const mapState = (state: RootState) => {
  const resultPipeline = getPipelineStageOperatorsFromBuilderState(state);
  const lastStage = resultPipeline[resultPipeline.length - 1];
  const isMergeOrOutPipeline = isOutputStage(lastStage);
  const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
  const isBuilderView = state.workspace === 'builder';

  return {
    isRunButtonDisabled: hasSyntaxErrors,
    isExplainButtonDisabled: hasSyntaxErrors,
    isExportButtonDisabled: isMergeOrOutPipeline || hasSyntaxErrors,
    showAIEntry:
      !state.pipelineBuilder.aiPipeline.isInputVisible &&
      resultPipeline.length > 0 &&
      isBuilderView,
    showUpdateViewButton: Boolean(state.editViewName),
    isUpdateViewButtonDisabled: !state.isModified || hasSyntaxErrors,
    isAtlasDeployed: state.isAtlasDeployed,
    showCollectionScanInsight: state.insights.isCollectionScan,
  };
};

const mapDispatch = {
  onUpdateView: updateView,
  onRunAggregation: runAggregation,
  onExportAggregationResults: exportAggregationResults,
  onExplainAggregation: explainAggregation,
  onCollectionScanInsightActionButtonClick: openCreateIndexModal,
  onShowAIInputClick: showAIInput,
};

export default connect(mapState, mapDispatch)(React.memo(PipelineActions));
