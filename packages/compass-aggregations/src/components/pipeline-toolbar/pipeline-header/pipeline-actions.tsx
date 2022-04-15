import React from 'react';
import { connect } from 'react-redux';
import {
  Button,
  css,
  spacing,
  Link,
  Icon,
} from '@mongodb-js/compass-components';

import { exportAggregationResults, runAggregation } from '../../../modules/aggregation';
import type { RootState } from '../../../modules';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const optionsButtonStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline',
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
  minWidth: '100px',
});

type PipelineActionsProps = {
  isPipelineInvalid: boolean;
  isOptionsVisible: boolean;
  onRunAggregation: () => void;
  onToggleOptions: () => void;
  onExportAggregationResults: () => void;
};

export const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  isPipelineInvalid,
  isOptionsVisible,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
}) => {
  const optionsIcon = isOptionsVisible ? 'CaretDown' : 'CaretRight';
  const showExportButton =
    process?.env?.COMPASS_ENABLE_AGGREGATION_EXPORT === 'true';
  return (
    <div className={containerStyles}>
      {showExportButton && (
        <Button
          data-testid="pipeline-toolbar-export-aggregation-button"
          variant="default"
          size="small"
          onClick={() => {
            onExportAggregationResults();
          }}
          disabled={isPipelineInvalid}
        >
          Export
        </Button>
      )}
      <Button
        data-testid="pipeline-toolbar-run-button"
        variant="primary"
        size="small"
        onClick={() => {
          onRunAggregation();
        }}
        disabled={isPipelineInvalid}
      >
        Run
      </Button>
      <Link
        as="button"
        className={optionsButtonStyles}
        data-testid="pipeline-toolbar-options-button"
        hideExternalIcon={true}
        onClick={() => onToggleOptions()}
      >
        <div className={optionStyles}>
          {isOptionsVisible ? 'Less' : 'More'} Options{' '}
          <Icon glyph={optionsIcon} />
        </div>
      </Link>
    </div>
  );
};

const mapState = ({ pipeline }: RootState) => ({
  isPipelineInvalid: pipeline.some((x) => !x.isValid),
});

const mapDispatch = {
  onRunAggregation: runAggregation,
  onExportAggregationResults: exportAggregationResults,
};

export default connect(mapState, mapDispatch)(PipelineActions);