import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  css,
  spacing,
  Link,
  Icon,
  uiColors,
} from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';
import {
  exportAggregationResults,
  runAggregation,
} from '../../../modules/aggregation';
import { isEmptyishStage } from '../../../modules/stage';
import { updateView } from '../../../modules/update-view';
import { explainAggregation } from '../../../modules/explain';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const optionsButtonStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline',
  height: spacing[4] + spacing[1],
  ':focus': {
    outline: `${spacing[1]}px auto ${uiColors.focus}`,
  },
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
  minWidth: '100px',
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
  showExportButton: _showExportButton,
  isExportButtonDisabled,
  showUpdateViewButton,
  isUpdateViewButtonDisabled,
  isExplainButtonDisabled,
  showExplainButton: _showExplainButton,
  onUpdateView,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
  onExplainAggregation,
}) => {
  const optionsIcon = isOptionsVisible ? 'CaretDown' : 'CaretRight';
  const showExportButton =
    process?.env?.COMPASS_ENABLE_AGGREGATION_EXPORT === 'true' &&
    _showExportButton;
  const showExplainButton =
    process?.env?.COMPASS_ENABLE_AGGREGATION_EXPLAIN === 'true' &&
    _showExplainButton;
  const optionsLabel = isOptionsVisible ? 'Less Options' : 'More Options';
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
      <Link
        aria-label={optionsLabel}
        aria-expanded={isOptionsVisible}
        aria-controls="pipeline-options"
        id="pipeline-toolbar-options"
        as="button"
        className={optionsButtonStyles}
        data-testid="pipeline-toolbar-options-button"
        hideExternalIcon={true}
        onClick={onToggleOptions}
      >
        <div className={optionStyles}>
          {optionsLabel}
          <Icon glyph={optionsIcon} />
        </div>
      </Link>
    </div>
  );
};

const mapState = ({ pipeline, editViewName, isModified }: RootState) => {
  const resultPipeline = pipeline.filter(
    (stageState) => !isEmptyishStage(stageState)
  );
  const lastStage = resultPipeline[resultPipeline.length - 1];
  const isMergeOrOutPipeline = ['$merge', '$out'].includes(
    lastStage?.stageOperator
  );
  const isPipelineInvalid = resultPipeline.some(
    (stageState) => !stageState.isValid || Boolean(stageState.error)
  );
  const isStageStateEmpty = pipeline.length === 0;

  return {
    isRunButtonDisabled: isPipelineInvalid || isStageStateEmpty,
    isExplainButtonDisabled: isPipelineInvalid,
    isExportButtonDisabled:
      isMergeOrOutPipeline || isPipelineInvalid || isStageStateEmpty,
    showUpdateViewButton: Boolean(editViewName),
    isUpdateViewButtonDisabled:
      !isModified || isPipelineInvalid || isStageStateEmpty,
  };
};

const mapDispatch = {
  onUpdateView: updateView,
  onRunAggregation: runAggregation,
  onExportAggregationResults: exportAggregationResults,
  onExplainAggregation: explainAggregation,
};

export default connect(mapState, mapDispatch)(PipelineActions);
