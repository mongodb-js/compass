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

import {
  exportAggregationResults,
  runAggregation,
} from '../../../modules/aggregation';

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
  isOptionsVisible: boolean;
  onRunAggregation: () => void;
  onToggleOptions: () => void;
  onExportAggregationResults: () => void;
};

export const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  isOptionsVisible,
  onRunAggregation,
  onToggleOptions,
  onExportAggregationResults,
}) => {
  const optionsIcon = isOptionsVisible ? 'CaretDown' : 'CaretRight';
  const showExportButton =
    process?.env?.COMPASS_ENABLE_AGGREGATION_EXPORT === 'true';
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
        >
          Export
        </Button>
      )}
      <Button
        aria-label={'Run aggregation'}
        data-testid="pipeline-toolbar-run-button"
        variant="primary"
        size="small"
        onClick={() => {
          onRunAggregation();
        }}
      >
        Run
      </Button>
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

export default connect(null, {
  onRunAggregation: runAggregation,
  onExportAggregationResults: exportAggregationResults,
})(PipelineActions);