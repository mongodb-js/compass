import React from 'react';
import { connect } from 'react-redux';
import type { Document as DocumentType } from 'mongodb';
import {
  css,
  cx,
  spacing,
  palette,
  Body,
  KeylineCard,
  Link,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

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
import { getIndexOfFirstStageWithServerError } from '../../modules/pipeline-builder/stage-editor';

import SearchNoResults from '../search-no-results';
import { usePreference } from 'compass-preferences-model/provider';
import SearchIndexStaleResultsBanner from '../search-index-stale-results-banner';

const centeredContent = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: spacing[400],
  flexDirection: 'column',
});

const emptyStyles = css({
  margin: 'auto',
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

function NoPreviewDocuments() {
  const darkMode = useDarkMode();

  return (
    <div className={centeredContent}>
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

type StagePreviewProps = {
  index: number;
  isLoading: boolean;
  isDisabled: boolean;
  isMissingAtlasOnlyStageSupport: boolean;
  stageOperator: string | null;
  documents: DocumentType[] | null;
  shouldRenderStage: boolean;
  showSearchIndexStaleResultsBanner: boolean;
  searchIndexName: string | null;
  serverErrorStageIdx: number | null;
};

function StagePreviewBody({
  index,
  stageOperator,
  documents,
  isMissingAtlasOnlyStageSupport,
  shouldRenderStage,
  isLoading,
  showSearchIndexStaleResultsBanner,
  searchIndexName,
  serverErrorStageIdx,
}: StagePreviewProps) {
  const enableSearchActivationProgramP1 = usePreference(
    'enableSearchActivationProgramP1'
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
    documents?.length === 0
  ) {
    return <SearchNoResults />;
  }

  if (documents && documents.length > 0) {
    const docs = documents.map((doc, i) => {
      return (
        <KeylineCard key={i} className={documentContainerStyles}>
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
      </div>
    );
  }

  return <NoPreviewDocuments />;
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

  return {
    isLoading: stage.loading,
    isDisabled: stage.disabled,
    stageOperator: stage.stageOperator,
    shouldRenderStage,
    documents: stage.previewDocs,
    isMissingAtlasOnlyStageSupport: !!isMissingAtlasOnlyStageSupport,
    showSearchIndexStaleResultsBanner,
    searchIndexName,
    serverErrorStageIdx: getIndexOfFirstStageWithServerError(
      state.pipelineBuilder.stageEditor.stages,
      ownProps.index
    ),
  };
})(StagePreview);
