import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import type { ResultsViewType } from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import { changeViewType } from '../../modules/aggregation';
import { getStageOperator } from '../../utils/stage';

type PipelineResultsHeaderProps = {
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsViewType: ResultsViewType;
  isMergeOrOutPipeline: boolean;
};

const controlsStyles = css({
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'flex-end',
  alignItems: 'center',
});

export const PipelineResultsHeader: React.FunctionComponent<PipelineResultsHeaderProps> =
  ({ onChangeResultsView, resultsViewType, isMergeOrOutPipeline }) => {
    if (isMergeOrOutPipeline) {
      return null;
    }

    return (
      <div data-testid="pipeline-results-header">
        <div className={controlsStyles}>
          <PipelinePagination />
          <PipelineResultsViewControls
            value={resultsViewType}
            onChange={onChangeResultsView}
          />
        </div>
      </div>
    );
  };

const mapState = (state: RootState) => {
  const {
    aggregation: { resultsViewType, pipeline }
  } = state;
  const lastStage = pipeline[pipeline.length - 1];
  const stageOperator = getStageOperator(lastStage) ?? '';
  return {
    resultsViewType,
    isMergeOrOutPipeline: ['$merge', '$out'].includes(stageOperator)
  };
};

const mapDispatch = {
  onChangeResultsView: changeViewType
};

export default connect(mapState, mapDispatch)(PipelineResultsHeader);

