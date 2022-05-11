import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import type { ResultsViewType } from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';

type PipelineResultsHeaderProps = {
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
  ({ onChangeResultsView, resultsView }) => {
    return (
      <div data-testid="pipeline-results-header">
        <div className={controlsStyles}>
          <PipelinePagination />
          <PipelineResultsViewControls
            value={resultsView}
            onChange={onChangeResultsView}
          />
        </div>
      </div>
    );
  };

export default PipelineResultsHeader;
