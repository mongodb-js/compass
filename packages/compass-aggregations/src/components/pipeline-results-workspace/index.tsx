import React from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import {
  css,
  cx,
  spacing,
  CancelLoader,
  ErrorSummary,
  Subtitle,
  Button,
  uiColors
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { cancelAggregation, retryAggregation } from '../../modules/aggregation';
import PipelineResultsList from './pipeline-results-list';
import PipelineEmptyResults from './pipeline-empty-results';
import {
  getDestinationNamespaceFromStage,
  isEmptyishStage
} from '../../modules/stage';
import { goToNamespace } from '../../modules/pipeline';

const containerStyles = css({
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'min-content 1fr',
  gridTemplateColumns: '1fr',
  marginBottom: spacing[3],
});

const resultsStyles = css({
  height: '100%',
  overflowY: 'auto',
  '&:not(:first-child)': {
    height: `calc(100% - ${spacing[3]}px)`,
    marginTop: spacing[3]
  }
});

const results = css({
  display: 'flex',
  alignItems: 'flex-start',
  paddingLeft: spacing[3] + spacing[1],
  paddingRight: spacing[5] + spacing[1]
});

const centered = css({
  width: '100%',
  height: '100%',
  paddingTop: spacing[6] * 2,
  justifyContent: 'center'
});

const ResultsContainer: React.FunctionComponent<{ center?: boolean }> = ({
  children,
  center
}) => {
  return <div className={cx(results, center && centered)}>{children}</div>;
};

const outResult = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[2],
  maxWidth: spacing[6] * 8,
  marginTop: spacing[2],
  marginBottom: spacing[2]
});

const outResultText = css({
  color: uiColors.green.dark2,
  textAlign: 'center'
});

const OutResultBanner: React.FunctionComponent<{
  namespace?: string | null;
  onClick?: () => void;
}> = ({ namespace, onClick }) => {
  return (
    <div className={outResult}>
      <Subtitle className={outResultText}>
        Results persisted
        {namespace ? ` in ${namespace} namespace` : ''}
      </Subtitle>
      {namespace && (
        <Button
          data-testid="pipeline-results-go-to-collection"
          variant="primaryOutline"
          onClick={onClick}
        >
          Go to collection
        </Button>
      )}
    </div>
  );
};

type PipelineResultsWorkspaceProps = {
  documents: Document[];
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  isMergeOrOutPipeline?: boolean;
  mergeOrOutDestination?: string | null;
  resultsViewType: 'document' | 'json';
  onOutClick?: (ns: string) => void;
  onCancel: () => void;
  onRetry: () => void;
};

export const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspaceProps> =
  ({
    documents,
    isLoading,
    error,
    isError,
    isEmpty,
    isMergeOrOutPipeline,
    mergeOrOutDestination,
    resultsViewType,
    onOutClick,
    onRetry,
    onCancel
  }) => {
    let results: React.ReactElement | null = null;

    if (isError && error) {
      results = (
        <ResultsContainer>
          <ErrorSummary
            data-testid="pipeline-results-error"
            errors={error}
            onAction={onRetry}
            actionText="Retry"
          />
        </ResultsContainer>
      );
    } else if (isLoading) {
      results = (
        <ResultsContainer center>
          <CancelLoader
            data-testid="pipeline-results-loader"
            progressText={
              isMergeOrOutPipeline
                ? `Persisting documents${
                    mergeOrOutDestination
                      ? ` to ${mergeOrOutDestination} namespace`
                      : ''
                  }`
                : 'Running aggregation'
            }
            cancelText="Stop"
            onCancel={onCancel}
          />
        </ResultsContainer>
      );
    } else if (isMergeOrOutPipeline) {
      results = (
        <ResultsContainer center>
          <OutResultBanner
            namespace={mergeOrOutDestination}
            onClick={() => {
              if (mergeOrOutDestination) {
                onOutClick?.(mergeOrOutDestination);
              }
            }}
          ></OutResultBanner>
        </ResultsContainer>
      );
    } else if (isEmpty) {
      results = (
        <ResultsContainer center>
          <PipelineEmptyResults />
        </ResultsContainer>
      );
    } else {
      results = (
        <PipelineResultsList documents={documents} view={resultsViewType} />
      );
    }

    return (
      <div data-testid="pipeline-results-workspace" className={containerStyles}>
        <div className={resultsStyles}>{results}</div>
      </div>
    );
  };

const mapState = ({
  pipeline,
  namespace,
  aggregation: { documents, loading, error, resultsViewType }
}: RootState) => {
  const resultPipeline = pipeline.filter(
    (stageState) => !isEmptyishStage(stageState)
  );
  const lastStage = resultPipeline[resultPipeline.length - 1];

  return {
    documents,
    isLoading: loading,
    error,
    isError: Boolean(error),
    isEmpty: documents.length === 0,
    resultsViewType: resultsViewType,
    isMergeOrOutPipeline: ['$merge', '$out'].includes(lastStage?.stageOperator),
    mergeOrOutDestination: getDestinationNamespaceFromStage(
      namespace,
      lastStage
    )
  };
};

const mapDispatch = {
  onCancel: cancelAggregation,
  onRetry: retryAggregation,
  onOutClick: goToNamespace
};

export default connect(mapState, mapDispatch)(PipelineResultsWorkspace);
