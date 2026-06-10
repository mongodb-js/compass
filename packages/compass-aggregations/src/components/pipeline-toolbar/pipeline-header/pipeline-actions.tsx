import React, { useCallback, useMemo } from 'react';
import { connect } from 'react-redux';
import {
  Button,
  DropdownMenuButton,
  OptionsToggle,
  PerformanceSignals,
  SignalPopover,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { AIExperienceEntry } from '@mongodb-js/compass-generative-ai/provider';
import type { RootState } from '../../../modules';
import { runAggregation } from '../../../modules/aggregation';
import { updateView } from '../../../modules/update-view';
import {
  explainAggregationVisualTree,
  explainAggregationRawOutput,
  explainAggregationInterpret,
} from '../../../modules/explain';
import {
  getIsPipelineInvalidFromBuilderState,
  getPipelineStageOperatorsFromBuilderState,
} from '../../../modules/pipeline-builder/builder-helpers';
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

  showUpdateViewButton?: boolean;
  isUpdateViewButtonDisabled?: boolean;
  onUpdateView: () => void;

  showExplainButton?: boolean;
  isExplainButtonDisabled?: boolean;
  onExplainAggregationVisualTree: () => void;
  onExplainAggregationRawOutput: () => void;
  onExplainAggregationInterpret: () => void;

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
  showUpdateViewButton,
  isUpdateViewButtonDisabled,
  isExplainButtonDisabled,
  showExplainButton,
  showAIEntry,
  onShowAIInputClick,
  onUpdateView,
  onRunAggregation,
  onToggleOptions,
  onExplainAggregationVisualTree,
  onExplainAggregationRawOutput,
  onExplainAggregationInterpret,
  showCollectionScanInsight,
  onCollectionScanInsightActionButtonClick,
  stages,
}) => {
  const {
    readWrite: preferencesReadWrite,
    enableAggregationBuilderExtraOptions,
    showInsights,
    enableSearchActivationProgramP2,
  } = usePreferences([
    'readWrite',
    'enableAggregationBuilderExtraOptions',
    'showInsights',
    'enableSearchActivationProgramP2',
  ]);
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const { tellMoreAboutInsight, getIsAssistantEnabled } = useAssistantActions();
  const isAssistantEnabled = getIsAssistantEnabled();

  const hasSearchStage = stages.includes('$search');

  type ExplainAction = 'interpret' | 'visual-tree' | 'raw-output';

  const explainActions = useMemo(
    (): {
      action: ExplainAction;
      label: string;
      isDisabled?: boolean;
      disabledDescription?: string;
    }[] => [
      {
        action: 'interpret',
        label: 'Interpret',
        isDisabled: !isAssistantEnabled,
      },
      {
        action: 'visual-tree',
        label: 'Visual tree',
        isDisabled: hasSearchStage,
        disabledDescription: hasSearchStage
          ? 'Not supported for this query'
          : undefined,
      },
      { action: 'raw-output', label: 'Raw output' },
    ],
    [isAssistantEnabled, hasSearchStage]
  );

  const onExplainAction = useCallback(
    (action: ExplainAction) => {
      if (action === 'interpret') {
        onExplainAggregationInterpret();
      } else if (action === 'visual-tree') {
        onExplainAggregationVisualTree();
      } else {
        onExplainAggregationRawOutput();
      }
    },
    [
      onExplainAggregationVisualTree,
      onExplainAggregationRawOutput,
      onExplainAggregationInterpret,
    ]
  );

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
      {showExplainButton &&
        (enableSearchActivationProgramP2 ? (
          <DropdownMenuButton
            data-testid="pipeline-toolbar-explain-aggregation-button"
            buttonText="Explain"
            buttonProps={{
              size: 'small',
              variant: 'default',
              disabled: isExplainButtonDisabled,
            }}
            actions={explainActions}
            onAction={onExplainAction}
            hideOnNarrow={false}
          />
        ) : (
          <Button
            aria-label="Explain aggregation"
            data-testid="pipeline-toolbar-explain-aggregation-button"
            variant="default"
            size="small"
            onClick={onExplainAggregationVisualTree}
            disabled={isExplainButtonDisabled}
          >
            Explain
          </Button>
        ))}
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
  const hasSyntaxErrors = getIsPipelineInvalidFromBuilderState(state, false);
  const isBuilderView = state.workspace === 'builder';
  const isAIFetching = state.pipelineBuilder.aiPipeline.status === 'fetching';

  return {
    isRunButtonDisabled: hasSyntaxErrors || isAIFetching,
    isExplainButtonDisabled: hasSyntaxErrors || isAIFetching,
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
  onExplainAggregationVisualTree: explainAggregationVisualTree,
  onExplainAggregationRawOutput: explainAggregationRawOutput,
  onExplainAggregationInterpret: explainAggregationInterpret,
  onCollectionScanInsightActionButtonClick: openCreateIndexModal,
  onShowAIInputClick: showAIInput,
};

export default connect(mapState, mapDispatch)(React.memo(PipelineActions));
