import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  OptionsToggle,
  PerformanceSignals,
  SignalPopover,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { AIExperienceEntry } from '@mongodb-js/compass-generative-ai';
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
import {
  useIsAIFeatureEnabled,
  usePreferences,
} from 'compass-preferences-model/provider';
import { showInput as showAIInput } from '../../../modules/pipeline-builder/pipeline-ai';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
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

  showAIEntry: boolean;
  onShowAIInputClick: () => void;

  showCollectionScanInsight?: boolean;
  onCollectionScanInsightActionButtonClick: () => void;

  stages: string[];
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
  showCollectionScanInsight,
  onCollectionScanInsightActionButtonClick,
  stages,
}) => {
  const {
    readWrite: preferencesReadWrite,
    enableAggregationBuilderExtraOptions,
    showInsights,
  } = usePreferences([
    'readWrite',
    'enableAggregationBuilderExtraOptions',
    'showInsights',
  ]);
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const { tellMoreAboutInsight } = useAssistantActions();

  return (
    <div className={containerStyles}>
      {isAIFeatureEnabled && showAIEntry && (
        <AIExperienceEntry onClick={onShowAIInputClick} type="aggregation" />
      )}
      {showInsights && showCollectionScanInsight && (
        <div>
          <SignalPopover
            signals={{
              ...PerformanceSignals.get('aggregation-executed-without-index'),
              ...(preferencesReadWrite
                ? {
                    // Disable insight primary action if can't create indexes
                    primaryActionButtonLabel: undefined,
                  }
                : {
                    onPrimaryActionButtonClick:
                      onCollectionScanInsightActionButtonClick,
                  }),
              onAssistantButtonClick:
                tellMoreAboutInsight &&
                (() => {
                  tellMoreAboutInsight({
                    id: 'aggregation-executed-without-index',
                    stages,
                  });
                }),
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
      {enableAggregationBuilderExtraOptions && (
        <OptionsToggle
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
  const isAIFetching = state.pipelineBuilder.aiPipeline.status === 'fetching';

  return {
    isRunButtonDisabled: hasSyntaxErrors || isAIFetching,
    isExplainButtonDisabled: hasSyntaxErrors || isAIFetching,
    isExportButtonDisabled:
      isMergeOrOutPipeline || hasSyntaxErrors || isAIFetching,
    showAIEntry:
      !state.pipelineBuilder.aiPipeline.isInputVisible &&
      resultPipeline.length > 0 &&
      isBuilderView,
    showUpdateViewButton: Boolean(state.editViewName),
    isUpdateViewButtonDisabled:
      !state.isModified || hasSyntaxErrors || isAIFetching,
    showCollectionScanInsight: state.insights.isCollectionScan,
    stages: resultPipeline,
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
