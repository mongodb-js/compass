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
  isOptionsVisible?: boolean;
  showRunButton?: boolean;
  isRunButtonDisabled?: boolean;
  showExportButton?: boolean;
  isExportButtonDisabled?: boolean;
  onRunAggregation: () => void;
  onToggleOptions: () => void;
  onExportAggregationResults: () => void;
};

export const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  isOptionsVisible,
  showRunButton,
  isRunButtonDisabled,
  showExportButton: _showExportButton,
  isExportButtonDisabled,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
}) => {
  const optionsIcon = isOptionsVisible ? 'CaretDown' : 'CaretRight';
  const showExportButton =
    process?.env?.COMPASS_ENABLE_AGGREGATION_EXPORT === 'true' &&
    _showExportButton;
  const optionsLabel = isOptionsVisible ? 'Less Options' : 'More Options';
  return (
    <div className={containerStyles}>
      {showExportButton && (
        <Button
          aria-label={'Export aggregation'}
          data-testid="pipeline-toolbar-export-aggregation-button"
          variant="default"
          size="small"
          onClick={() => {
            onExportAggregationResults();
          }}
          disabled={isExportButtonDisabled}
        >
          Export
        </Button>
      )}
      {showRunButton && <Button
        aria-label={'Run aggregation'}
        data-testid="pipeline-toolbar-run-button"
        variant="primary"
        size="small"
        onClick={() => {
          onRunAggregation();
        }}
        disabled={isRunButtonDisabled}
      >
        Run
      </Button>}
      <Link
        aria-label={optionsLabel}
        aria-expanded={isOptionsVisible}
        aria-controls="pipeline-options"
        id="pipeline-toolbar-options"
        as="button"
        className={optionsButtonStyles}
        data-testid="pipeline-toolbar-options-button"
        hideExternalIcon={true}
        onClick={() => onToggleOptions()}
      >
        <div className={optionStyles}>
          {optionsLabel}
          <Icon glyph={optionsIcon} />
        </div>
      </Link>
    </div>
  );
};

const mapState = ({ pipeline }: RootState) => {
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

  return {
    isRunButtonDisabled: isPipelineInvalid,
    isExportButtonDisabled: isMergeOrOutPipeline || isPipelineInvalid
  };
};

const mapDispatch = {
  onRunAggregation: runAggregation,
  onExportAggregationResults: exportAggregationResults,
};

export default connect(mapState, mapDispatch)(PipelineActions);
