import React from 'react';
import { connect } from 'react-redux';
import type HadronDocument from 'hadron-document';
import {
  css,
  cx,
  spacing,
  CancelLoader,
  Subtitle,
  Button,
  Icon,
  palette,
  Banner,
  BannerVariant,
  showErrorDetails,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { usePreference } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { buildProjectSettingsUrl } from '@mongodb-js/atlas-service/provider';
import RateLimitExceededBanner from '../rate-limit-exceeded-banner';
import type { RootState } from '../../modules';
import {
  type AggregationError,
  cancelAggregation,
  retryAggregation,
} from '../../modules/aggregation';
import PipelineResultsList from './pipeline-results-list';
import PipelineEmptyResults from './pipeline-empty-results';
import {
  getDestinationNamespaceFromStage,
  isOutputStage,
} from '../../utils/stage';
import { getStageOperator } from '../../utils/stage';
import { gotoOutResults } from '../../modules/out-results-fn';
import {
  isRerankNotEnabledError,
  getVoyageProjectRateLimitInfo,
  getSearchExtensionTypeFromStage,
  type SearchExtensionType,
  isRerankVersionSupported,
} from '../../utils/search-stage-errors';
import { RerankVersionWarningBanner } from '../rerank-version-warning-banner';

const containerStyles = css({
  overflow: 'hidden',
  display: 'grid',
  gridTemplateRows: 'min-content 1fr',
  gridTemplateColumns: '1fr',
});

const resultsStyles = css({
  height: '100%',
  overflowY: 'auto',
  '&:not(:first-child)': {
    height: `calc(100% - ${spacing[400]}px)`,
    marginTop: spacing[400],
  },
});

const results = css({
  display: 'flex',
  alignItems: 'flex-start',
  paddingLeft: spacing[400] + spacing[100],
  paddingRight: spacing[800] + spacing[100],
});

const centered = css({
  width: '100%',
  height: '100%',
  paddingTop: spacing[1600] * 2,
  justifyContent: 'center',
});

const errorBannerStyles = css({
  width: '100%',
});

const errorBannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const errorBannerTextStyles = css({
  flex: 1,
});

const rerankBannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const errorDetailsBtnStyles = css({
  marginLeft: spacing[100],
});

const ResultsContainer: React.FunctionComponent<{ center?: boolean }> = ({
  children,
  center,
}) => {
  return <div className={cx(results, center && centered)}>{children}</div>;
};

const outResult = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[200],
  maxWidth: spacing[1600] * 8,
  marginTop: spacing[200],
  marginBottom: spacing[200],
});

const outResultText = css({
  color: palette.green.dark2,
  textAlign: 'center',
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
  namespace: string;
  documents: HadronDocument[];
  isLoading?: boolean;
  isError?: boolean;
  error?: AggregationError;
  isEmpty?: boolean;
  isMergeOrOutPipeline?: boolean;
  mergeOrOutDestination?: string | null;
  resultsViewType: 'document' | 'json';
  onOutClick?: (ns: string) => void;
  onCancel: () => void;
  onRetry: () => void;
  serverVersion: string;
  hasRerankStage: boolean;
  searchExtensionType?: SearchExtensionType | null;
};

export const PipelineResultsWorkspace: React.FunctionComponent<
  PipelineResultsWorkspaceProps
> = ({
  namespace,
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
  onCancel,
  serverVersion,
  hasRerankStage,
  searchExtensionType,
}) => {
  const { atlasMetadata } = useConnectionInfo();
  const enableRerank = usePreference('enableRerank');
  const track = useTelemetry();
  let results: React.ReactElement | null = null;

  const showRerankVersionWarning =
    enableRerank && hasRerankStage && !isRerankVersionSupported(serverVersion);

  const rerankNotEnabled =
    isError && error ? isRerankNotEnabledError(error.message) : false;
  const rateLimitInfo =
    isError && error ? getVoyageProjectRateLimitInfo(error.message) : null;
  const projectSettingsHref = rerankNotEnabled
    ? atlasMetadata
      ? buildProjectSettingsUrl({ projectId: atlasMetadata.projectId })
      : 'https://dochub.mongodb.org/core/manage-native-reranking'
    : null;

  if (isError && error && rerankNotEnabled) {
    results = (
      <ResultsContainer>
        <Banner
          data-testid="pipeline-results-error"
          variant={BannerVariant.Danger}
          className={errorBannerStyles}
        >
          <b>$rerank not enabled</b>
          <br />
          <div className={rerankBannerContentStyles}>
            <span>Enable native reranking in project settings.</span>
            {projectSettingsHref && (
              <Button
                size="xsmall"
                onClick={() => {
                  track('Rerank Project Settings Button Clicked', {
                    context: 'Rerank Not Enabled Banner',
                  });
                  window.open(
                    projectSettingsHref,
                    '_blank',
                    'noopener noreferrer'
                  );
                }}
                rightGlyph={<Icon glyph="OpenNewTab" />}
              >
                Project Settings
              </Button>
            )}
          </div>
        </Banner>
      </ResultsContainer>
    );
  } else if (isError && error && rateLimitInfo) {
    results = (
      <ResultsContainer>
        <RateLimitExceededBanner
          rateLimitInfo={rateLimitInfo}
          searchExtensionType={searchExtensionType}
          dataTestId="pipeline-results-error"
        />
      </ResultsContainer>
    );
  } else if (isError && error) {
    results = (
      <ResultsContainer>
        <Banner
          data-testid="pipeline-results-error"
          variant={BannerVariant.Danger}
          className={errorBannerStyles}
        >
          <div className={errorBannerContentStyles}>
            <div className={errorBannerTextStyles}>{error?.message}</div>
            <Button
              size="xsmall"
              onClick={onRetry}
              data-testid="pipeline-results-error-retry-button"
              className={errorDetailsBtnStyles}
            >
              RETRY
            </Button>
            {error?.info && (
              <Button
                size="xsmall"
                onClick={() =>
                  showErrorDetails({
                    details: error.info!,
                    closeAction: 'close',
                  })
                }
                data-testid="pipeline-results-error-details-button"
                className={errorDetailsBtnStyles}
              >
                VIEW ERROR DETAILS
              </Button>
            )}
          </div>
        </Banner>
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
    results = <PipelineEmptyResults />;
  } else {
    results = (
      <PipelineResultsList
        namespace={namespace}
        documents={documents}
        view={resultsViewType}
      />
    );
  }

  return (
    <div data-testid="pipeline-results-workspace" className={containerStyles}>
      {showRerankVersionWarning && (
        <ResultsContainer>
          <RerankVersionWarningBanner data-testid="pipeline-results-rerank-version-warning" />
        </ResultsContainer>
      )}
      <div className={resultsStyles}>{results}</div>
    </div>
  );
};

const mapState = (state: RootState) => {
  const {
    namespace,
    serverVersion,
    aggregation: { documents, loading, error, resultsViewType, pipeline },
  } = state;
  const lastStage = pipeline[pipeline.length - 1];
  const stageOperator = getStageOperator(lastStage) ?? '';
  const searchExtensionType = pipeline.reduce<SearchExtensionType | null>(
    (found, stage) =>
      found ?? getSearchExtensionTypeFromStage(getStageOperator(stage)),
    null
  );

  return {
    namespace,
    documents,
    isLoading: loading,
    error,
    isError: Boolean(error),
    isEmpty: documents.length === 0,
    resultsViewType: resultsViewType,
    isMergeOrOutPipeline: isOutputStage(stageOperator),
    mergeOrOutDestination: getDestinationNamespaceFromStage(
      namespace,
      lastStage
    ),
    serverVersion,
    hasRerankStage: pipeline.some(
      (stage) => getStageOperator(stage) === '$rerank'
    ),
    searchExtensionType,
  };
};

const mapDispatch = {
  onCancel: cancelAggregation,
  onRetry: retryAggregation,
  onOutClick: gotoOutResults,
};

export default connect(mapState, mapDispatch)(PipelineResultsWorkspace);
