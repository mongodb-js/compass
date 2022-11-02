import React from 'react';
import { css, Overline, spacing } from '@mongodb-js/compass-components';
import type { ResultsViewType } from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import { changeViewType } from '../../modules/aggregation';
import { getStageOperator, isOutputStage } from '../../utils/stage';
import { PipelineOutputOptionsMenu } from '../pipeline-output-options-menu';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';

type PipelineResultsHeaderProps = {
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsViewType: ResultsViewType;
  isMergeOrOutPipeline: boolean;
  onChangePipelineOutputOption: (val: PipelineOutputOption) => void;
  pipelineOutputOption: PipelineOutputOption;
};

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const pipelineOptionsStyles = css({
  display: 'flex',
  gap: spacing[2],
});

const pipelinePaginationStyles = css({
  display: 'flex',
  gap: spacing[2],
  marginLeft: 'auto',
});

export const PipelineResultsHeader: React.FunctionComponent<
  PipelineResultsHeaderProps
> = ({
  onChangeResultsView,
  resultsViewType,
  isMergeOrOutPipeline,
  onChangePipelineOutputOption,
  pipelineOutputOption,
}) => {
  if (isMergeOrOutPipeline) {
    return null;
  }
  return (
    <div className={containerStyles} data-testid="pipeline-results-header">
      {process?.env?.COMPASS_ENABLE_AS_TEXT_PIPELINE === 'true' && (
        <div className={pipelineOptionsStyles}>
          <Overline>All Results</Overline>
          <PipelineOutputOptionsMenu
            option={pipelineOutputOption}
            onChangeOption={onChangePipelineOutputOption}
          />
        </div>
      )}
      <div className={pipelinePaginationStyles}>
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
    isMergeOrOutPipeline: isOutputStage(stageOperator)
  };
};

const mapDispatch = {
  onChangeResultsView: changeViewType
};

export default connect(mapState, mapDispatch)(PipelineResultsHeader);

