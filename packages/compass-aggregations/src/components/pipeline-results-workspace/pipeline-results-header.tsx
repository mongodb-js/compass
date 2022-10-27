import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
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

const controlsStyles = css({
  display: 'flex',
  gap: spacing[2],
});

export const PipelineResultsHeader: React.FunctionComponent<PipelineResultsHeaderProps> =
  ({ onChangeResultsView, resultsViewType, isMergeOrOutPipeline, onChangeAllDocsExpanded }) => {
    if (isMergeOrOutPipeline) {
      return null;
    }

    const disclosureControls =
      process?.env?.COMPASS_ENABLE_AS_TEXT_PIPELINE === 'true'
      ? <DocumentsDisclosureMenu onChange={(val) => onChangeAllDocsExpanded(val === 'expanded')} />
      : <div />;

    return (
      <div className={containerStyles} data-testid="pipeline-results-header">
        {disclosureControls}
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
    isMergeOrOutPipeline: isOutputStage(stageOperator)
  };
};

const mapDispatch = {
  onChangeResultsView: changeViewType
};

export default connect(mapState, mapDispatch)(PipelineResultsHeader);

