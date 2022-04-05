import React, { useState } from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import { css, spacing, Body, uiColors } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { cancelAggregation } from '../../modules/aggregation';

import type { ResultsViewType } from './pipeline-results-list';
import PipelineResultsLoader from './pipeline-results-loader';
import PipelineResultsList from './pipeline-results-list';
import PipelinePagination from './pipeline-pagination';
import PipelineResultsViewControls from './pipeline-results-view-controls';

type PipelineResultsWorkspaceProps = {
  documents: Document[];
  loading: boolean;
  hasEmptyResults: boolean;
  error?: string;
  onCancel: () => void;
};

const containerStyles = css({
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1],
  overflow: 'hidden',
  height: '100vh',
  display: 'grid',
  gap: spacing[2],
  gridTemplateAreas: `
    "header"
    "results"
  `,
  gridTemplateRows: 'min-content',
  marginTop: spacing[2],
  marginBottom: spacing[3],
});

const headerStyles = css({
  gridArea: 'header',
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'flex-end',
  alignItems: 'center',
});

const resultsStyles = css({
  gridArea: 'results',
  overflowY: 'auto',
});

const centeredContentStyles = css({
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const errorMessageStyles = css({
  color: uiColors.red.base,
});

export const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspaceProps> =
  ({ documents, hasEmptyResults, loading, error, onCancel }) => {
    const [resultsViewType, setResultsViewType] =
      useState<ResultsViewType>('document');

    return (
      <div data-testid="pipeline-results-workspace" className={containerStyles}>
        <div className={headerStyles}>
          <PipelinePagination />
          <PipelineResultsViewControls
            value={resultsViewType}
            onChange={setResultsViewType}
          />
        </div>
        <div className={resultsStyles}>
          <PipelineResultsList documents={documents} view={resultsViewType} />
          <div className={centeredContentStyles}>
            <PipelineResultsLoader loading={loading} onCancel={onCancel} />
            {hasEmptyResults && <Body>No results to show</Body>}
            {error && <Body className={errorMessageStyles}>{error}</Body>}
          </div>
        </div>
      </div>
    );
  };

const mapState = ({
  aggregation: { documents, loading, error },
}: RootState) => ({
  documents,
  error,
  loading,
  hasEmptyResults: documents.length === 0 && !error && !loading,
});

const mapDispatch = {
  onCancel: cancelAggregation,
};

export default connect(mapState, mapDispatch)(PipelineResultsWorkspace);
