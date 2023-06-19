import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  MoreOptionsToggle,
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
  onUpdateView,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
  onExplainAggregation,
  isAtlasDeployed,
  showCollectionScanInsight,
  onCollectionScanInsightActionButtonClick,
}) => {
  return (
    <div className={containerStyles}>
      {showCollectionScanInsight && (
        <div>
          <SignalPopover
            signals={{
              id: 'aggregation-executed-without-index',
              title: 'Aggregation executed without index',
              description: (
                <>
                  This aggregation ran without an index. If you plan on using
                  this query <strong>heavily</strong> in your application, you
                  should create an index that covers this aggregation.
                </>
              ),
              learnMoreLink:
                'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#indexes',
              primaryActionButtonLabel: 'Create index',
              primaryActionButtonIcon: 'Plus',
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

  return {
    isRunButtonDisabled: hasSyntaxErrors,
    isExplainButtonDisabled: hasSyntaxErrors,
    isExportButtonDisabled: isMergeOrOutPipeline || hasSyntaxErrors,
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
};

export default connect(mapState, mapDispatch)(React.memo(PipelineActions));
