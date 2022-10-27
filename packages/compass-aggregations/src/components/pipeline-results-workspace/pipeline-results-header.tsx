import React from 'react';
import { css, Overline, spacing } from '@mongodb-js/compass-components';
import type { ResultsViewType } from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';
import { connect } from 'react-redux';
import type { RootState } from '../../modules';
import { changeViewType } from '../../modules/aggregation';
import { getStageOperator, isOutputStage } from '../../utils/stage';
import { DocumentsDisclosureMenu } from '../documents-disclosure-menu';

type PipelineResultsHeaderProps = {
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsViewType: ResultsViewType;
  isMergeOrOutPipeline: boolean;
  onChangeAllDocsExpanded: (val: boolean) => void;
};

const containerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const groupStyles = css({
  display: 'flex',
  gap: spacing[2],
});

export const PipelineResultsHeader: React.FunctionComponent<PipelineResultsHeaderProps> =
  ({ onChangeResultsView, resultsViewType, isMergeOrOutPipeline, onChangeAllDocsExpanded }) => {
    if (isMergeOrOutPipeline) {
      return null;
    }
  return (
    <div className={containerStyles} data-testid="pipeline-results-header">
      {process?.env?.COMPASS_ENABLE_AS_TEXT_PIPELINE === 'true' ? (
        <div className={groupStyles}>
          <Overline>All Results</Overline>
          <DocumentsDisclosureMenu
            onChange={(val) => onChangeAllDocsExpanded(val === 'expanded')}
          />
        </div>
      ) : (
        <div />
      )}
      <div className={groupStyles}>
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

