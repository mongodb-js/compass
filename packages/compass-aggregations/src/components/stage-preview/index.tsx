import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import type { Document as DocumentType } from 'mongodb';
import {
  css,
  cx,
  spacing,
  palette,
  Body,
  Chip,
  KeylineCard,
  Link,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';
import { useAssistantActions } from '@mongodb-js/compass-assistant';

import type { RootState } from '../../modules';
import {
  isSearchStage,
  isMissingAtlasStageSupport,
  isOutputStage,
  getSearchIndexNameFromSearchStage,
} from '../../utils/stage';

import LoadingOverlay from '../loading-overlay';
import { AtlasStagePreview } from './atlas-stage-preview';
import OutputStagePreivew from './output-stage-preview';
import StagePreviewHeader from './stage-preview-header';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import {
  getIndexOfFirstStageWithServerError,
  getPipelineStringForStage,
} from '../../modules/pipeline-builder/stage-editor';
import type { StagePreviewMetadata } from '../../utils/search-score-injection';

import SearchNoResults from '../search-no-results';
import {
  useSearchActivationProgramP1,
  useSearchActivationProgramP2,
} from '@mongodb-js/compass-telemetry/provider';
import SearchIndexStaleResultsBanner from '../search-index-stale-results-banner';
import {
  SearchStageDiagnoseButton,
  useShouldShowSearchStageDiagnose,
} from '../search-stage-diagnose-button';
import {
  AnalyzeAndRefineResultsButton,
  buildAnalyzeOutputContext,
  useShouldShowAnalyzeOutput,
  type AnalyzableDocument,
} from '../search-analyze-output-button';

const centeredContent = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: spacing[400],
  flexDirection: 'column',
});

const emptyContentStyles = css({
  margin: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: spacing[200],
});

const emptyStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fill: 'none',
  textAlign: 'center',
});

const emptyStylesDark = css({
  stroke: palette.gray.base,
});

const emptyStylesLight = css({
  stroke: palette.gray.base,
});

function NoPreviewDocuments({ children }: { children?: React.ReactNode }) {
  const darkMode = useDarkMode();

  return (
    <div className={centeredContent}>
      <div className={emptyContentStyles}>
        <div
          className={cx(
            emptyStyles,
            darkMode ? emptyStylesDark : emptyStylesLight
          )}
        >
          <Body>
            <span data-testid="stage-preview-empty">No Preview Documents</span>
          </Body>
        </div>
        {children}
      </div>
    </div>
  );
}

const previewBodyStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  width: '100%',
  height: '100%',
});

const documentsStyles = css({
  gap: spacing[200],
  display: 'flex',
  alignItems: 'stretch',
  overflowX: 'auto',
});

const documentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  flexShrink: 0,
  width: '384px',
  marginBottom: spacing[200],
});

const documentStyles = css({
  flexBasis: '164px',
  flexGrow: 1,
  flexShrink: 0,
  overflow: 'auto',
  padding: 0,
});

const scoreChipStyles = css({
  alignSelf: 'flex-end',
  marginBlock: spacing[100],
  marginInline: spacing[200],
  fontWeight: 'bold',
});

type StagePreviewProps = {
  index: number;
  isLoading: boolean;
  isDisabled: boolean;
  isMissingAtlasOnlyStageSupport: boolean;
  stageOperator: string | null;
  stageValue?: string | null;
  documents: DocumentType[] | null;
  stageMetadata: StagePreviewMetadata | null;
  shouldRenderStage: boolean;
  showSearchIndexStaleResultsBanner: boolean;
  searchIndexName: string | null;
  serverErrorStageIdx: number | null;
  pipeline: string | null;
};

function StagePreviewBody({
  index,
  stageOperator,
  stageValue,
  documents,
  stageMetadata,
  isMissingAtlasOnlyStageSupport,
  shouldRenderStage,
  isLoading,
  showSearchIndexStaleResultsBanner,
  searchIndexName,
  serverErrorStageIdx,
  pipeline,
}: StagePreviewProps) {
  const { enableSearchActivationProgramP1 } = useSearchActivationProgramP1();
  const { enableSearchActivationProgramP2 } = useSearchActivationProgramP2({
    trackIsInSample: false,
  });
  const { interpretAnalyzeOutput, diagnoseSearchStage } = useAssistantActions();

  const handleAnalyzeOutput = useCallback(() => {
    if (!interpretAnalyzeOutput || !stageMetadata) return;
    const { output, documentCount } = buildAnalyzeOutputContext(
      (documents ?? []) as AnalyzableDocument[],
      stageMetadata
    );
    interpretAnalyzeOutput({
      pipeline: pipeline ?? '',
      output,
      documentCount,
    });
  }, [interpretAnalyzeOutput, documents, stageMetadata, pipeline]);

  const handleDiagnoseSearchStage = useCallback(() => {
    diagnoseSearchStage?.({
      stageOperator: stageOperator ?? '',
      indexName: searchIndexName,
      stageValue: stageValue ?? '',
    });
  }, [diagnoseSearchStage, stageOperator, searchIndexName, stageValue]);

  const isNoResultsSearchStage = useShouldShowSearchStageDiagnose(
    stageOperator,
    documents
  );

  const showAnalyzeButton = useShouldShowAnalyzeOutput(
    stageOperator,
    stageMetadata
  );

  if (!shouldRenderStage) {
    return <NoPreviewDocuments />;
  }

  if (isMissingAtlasOnlyStageSupport) {
    return (
      <div className={centeredContent}>
        <AtlasStagePreview stageOperator={stageOperator ?? ''} />
      </div>
    );
  }

  // $out/$merge renders its own loader
  if (isOutputStage(stageOperator ?? '')) {
    return (
      <div className={centeredContent}>
        <OutputStagePreivew index={index} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={centeredContent}>
        <LoadingOverlay text="Loading Preview Documents..." />
      </div>
    );
  }

  if (serverErrorStageIdx !== null) {
    return (
      <div className={centeredContent}>
        <Body>
          <span data-testid="stage-preview-upstream-error">
            Preview unavailable — error on{' '}
            <Link
              as="button"
              onClick={() => {
                document
                  .querySelector(`[data-stage-index="${serverErrorStageIdx}"]`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              Stage {serverErrorStageIdx + 1}
            </Link>
            .
          </span>
        </Body>
      </div>
    );
  }

  if (
    !enableSearchActivationProgramP1 &&
    isSearchStage(stageOperator) &&
    documents?.length === 0 &&
    !isNoResultsSearchStage
  ) {
    return <SearchNoResults />;
  }

  if (documents && documents.length > 0) {
    const showScoreChips =
      enableSearchActivationProgramP2 && stageMetadata?.type === '$search';
    const docs = documents.map((doc, i) => {
      const score = showScoreChips ? stageMetadata?.scores[i] ?? null : null;
      return (
        <KeylineCard key={i} className={documentContainerStyles}>
          {score !== null && (
            <Chip
              className={scoreChipStyles}
              variant="green"
              label={`Score: ${score.value}`}
              data-testid="stage-preview-search-score-chip"
            />
          )}
          <div className={documentStyles}>
            <Document doc={doc} editable={false} />
          </div>
        </KeylineCard>
      );
    });
    return (
      <div className={previewBodyStyles}>
        <div className={documentsStyles}>{docs}</div>
        {enableSearchActivationProgramP1 &&
          showSearchIndexStaleResultsBanner && (
            <SearchIndexStaleResultsBanner searchIndexName={searchIndexName} />
          )}
        {showAnalyzeButton && (
          <AnalyzeAndRefineResultsButton
            onClick={handleAnalyzeOutput}
            data-testid="analyze-search-output-button"
          />
        )}
      </div>
    );
  }

  return (
    <NoPreviewDocuments>
      {isNoResultsSearchStage && (
        <SearchStageDiagnoseButton
          onClick={handleDiagnoseSearchStage}
          data-testid="stage-preview-diagnose-search-button"
        />
      )}
    </NoPreviewDocuments>
  );
}

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  padding: spacing[400],
  gap: spacing[200],
  flex: 1,
});

const stagePreviewStyles = css({
  alignItems: 'stretch',
  position: 'relative',
  flexGrow: 1,
});

// exported for tests
export function StagePreview(props: StagePreviewProps) {
  if (props.isDisabled) {
    return (
      <div className={containerStyles}>
        <NoPreviewDocuments />
      </div>
    );
  }
  return (
    <div
      className={containerStyles}
      data-testid={`stage-preview-${props.index}`}
    >
      <StagePreviewHeader index={props.index} />
      <div className={stagePreviewStyles}>
        <StagePreviewBody {...props} />
      </div>
    </div>
  );
}

export default connect((state: RootState, ownProps: { index: number }) => {
  const stage = state.pipelineBuilder.stageEditor.stages[
    ownProps.index
  ] as StoreStage;
  const isMissingAtlasOnlyStageSupport = isMissingAtlasStageSupport(
    state.env,
    stage.stageOperator,
    stage.serverError
  );

  const shouldRenderStage = Boolean(
    !stage.disabled && !stage.syntaxError && !stage.syntaxError && stage.value
  );

  const searchIndexName = getSearchIndexNameFromSearchStage(
    stage.stageOperator,
    stage.value
  );
  const showSearchIndexStaleResultsBanner =
    !!searchIndexName &&
    state.searchIndexes.indexes.some(
      (x) => x.name === searchIndexName && x.status !== 'READY' && x.queryable
    );

  const pipeline = getPipelineStringForStage(
    state.pipelineBuilder.stageEditor.stages,
    ownProps.index
  );

  return {
    isLoading: stage.loading,
    isDisabled: stage.disabled,
    stageOperator: stage.stageOperator,
    stageValue: stage.value,
    shouldRenderStage,
    documents: stage.previewDocs,
    stageMetadata: stage.stageMetadata,
    isMissingAtlasOnlyStageSupport: !!isMissingAtlasOnlyStageSupport,
    showSearchIndexStaleResultsBanner,
    searchIndexName,
    serverErrorStageIdx: getIndexOfFirstStageWithServerError(
      state.pipelineBuilder.stageEditor.stages,
      ownProps.index
    ),
    pipeline,
  };
})(StagePreview);
