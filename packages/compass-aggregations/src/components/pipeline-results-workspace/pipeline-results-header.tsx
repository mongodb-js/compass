import React, { useCallback } from 'react';
import { css, Overline, spacing } from '@mongodb-js/compass-components';
import type { ResultsViewType } from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import {
  changeViewType,
  expandPipelineResults,
  collapsePipelineResults,
} from '../../modules/aggregation';
import { getStageOperator, isOutputStage } from '../../utils/stage';
import { PipelineOutputOptionsMenu } from '../pipeline-output-options-menu';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';

type PipelineResultsHeaderProps = {
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsViewType: ResultsViewType;
  isMergeOrOutPipeline: boolean;
  onExpand: () => void;
  onCollapse: () => void;
};

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const pipelineOptionsStyles = css({
  display: 'flex',
  gap: spacing[200],
});

const pipelinePaginationStyles = css({
  display: 'flex',
  gap: spacing[200],
  marginLeft: 'auto',
});

export const PipelineResultsHeader: React.FunctionComponent<
  PipelineResultsHeaderProps
> = ({
  onChangeResultsView,
  resultsViewType,
  isMergeOrOutPipeline,
  onExpand,
  onCollapse,
}) => {
  const handlePipelineOutputOptionsMenuChange = useCallback(
    (option: PipelineOutputOption) => {
      if (option === 'expand') {
        onExpand();
      } else if (option === 'collapse') {
        onCollapse();
      }
    },
    [onExpand, onCollapse]
  );

  if (isMergeOrOutPipeline) {
    return null;
  }
  return (
    <div className={containerStyles} data-testid="pipeline-results-header">
      <div className={pipelineOptionsStyles}>
        <Overline>All Results</Overline>
      </div>
      <div className={pipelinePaginationStyles}>
        <PipelinePagination />
        <PipelineOutputOptionsMenu
          buttonText=""
          onChangeOption={handlePipelineOutputOptionsMenuChange}
        />
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
    aggregation: { resultsViewType, pipeline },
  } = state;
  const lastStage = pipeline[pipeline.length - 1];
  const stageOperator = getStageOperator(lastStage) ?? '';
  return {
    resultsViewType,
    isMergeOrOutPipeline: isOutputStage(stageOperator),
  };
};

const mapDispatch = {
  onChangeResultsView: changeViewType,
  onExpand: expandPipelineResults,
  onCollapse: collapsePipelineResults,
};

export default connect(mapState, mapDispatch)(PipelineResultsHeader);
