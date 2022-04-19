import React from 'react';
import { connect } from 'react-redux';
import { css, spacing, ErrorSummary } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { retryAggregation } from '../../modules/aggregation';

import type { ResultsViewType } from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';

type PipelineResultsHeaderProps = {
  className: string;
  error?: string;
  onRetry: () => void;
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsView: ResultsViewType;
};

const controlsStyles = css({
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'flex-end',
  alignItems: 'center',
});

export const PipelineResultsHeader: React.FunctionComponent<PipelineResultsHeaderProps> =
  ({ className, error, onRetry, onChangeResultsView, resultsView }) => {
    return (
      <div data-testid="pipeline-results-header" className={className}>
        <div className={controlsStyles}>
          <PipelinePagination />
          <PipelineResultsViewControls
            value={resultsView}
            onChange={onChangeResultsView}
          />
        </div>
        {error && (
          <ErrorSummary
            dataTestId="pipeline-results-error"
            errors={[{ message: error }]}
            onAction={onRetry}
            actionText="Retry"
          />
        )}
      </div>
    );
  };

const mapState = ({ aggregation: { error } }: RootState) => ({
  error,
});

const mapDispatch = {
  onRetry: retryAggregation,
};

export default connect(mapState, mapDispatch)(PipelineResultsHeader);
