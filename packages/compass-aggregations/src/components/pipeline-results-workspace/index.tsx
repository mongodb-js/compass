import React, { useState } from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import { css, cx, spacing, CancelLoader } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { cancelAggregation } from '../../modules/aggregation';

import type { ResultsViewType } from './pipeline-results-list';
import PipelineResultsList from './pipeline-results-list';
import PipelineEmptyResults from './pipeline-empty-results';
import PipelineResultsHeader from './pipeline-results-header';

type PipelineResultsWorkspaceProps = {
  documents: Document[];
  loading: boolean;
  hasEmptyResults: boolean;
  error?: string;
  onCancel: () => void;
};

const containerStyles = css({
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
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1],
  gridArea: 'header',
  gap: spacing[2],
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

export const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspaceProps> =
  ({ documents, hasEmptyResults, loading, onCancel }) => {
    const [resultsViewType, setResultsViewType] =
      useState<ResultsViewType>('document');

    const isResultsListHidden = loading || hasEmptyResults;

    return (
      <div data-testid="pipeline-results-workspace" className={containerStyles}>
        <div className={headerStyles}>
          <PipelineResultsHeader
            resultsView={resultsViewType}
            onChangeResultsView={setResultsViewType}
          />
        </div>
        <div className={resultsStyles}>
          <PipelineResultsList documents={documents} view={resultsViewType} />
          <div className={cx(isResultsListHidden && centeredContentStyles)}>
            {loading && (
              <CancelLoader
                dataTestId="pipeline-results-loader"
                progressText="Running aggregation"
                cancelText="Stop"
                onCancel={() => onCancel()}
              />
            )}
            {hasEmptyResults && <PipelineEmptyResults />}
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
