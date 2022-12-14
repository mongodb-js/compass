import React from 'react';
import decomment from 'decomment';
import { connect } from 'react-redux';
import type { Document as DocumentType  } from 'mongodb';

import { css, cx, spacing, palette, Body, Link, Button, KeylineCard, useDarkMode } from '@mongodb-js/compass-components';
import { Document } from '@mongodb-js/compass-crud';

import type { RootState } from '../modules';
import { gotoOutResults } from '../modules/out-results-fn';
import { runStage } from '../modules/pipeline-builder/stage-editor';
import {
  isMissingAtlasStageSupport,
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../utils/stage';

import LoadingOverlay from './loading-overlay';
import { AtlasStagePreview } from './atlas-stage-preview';

const stagePreviewOutStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  paddingTop: spacing[5],
  paddingLeft: spacing[1],
  paddingRight: spacing[1],
  paddingBottom: spacing[2],
});

const stagePreviewOutTextStyles = css({
  padding: `0 ${spacing[3]}px ${spacing[1]}px ${spacing[3]}px`,
  textAlign: 'center',
  marginBottom: spacing[2]
});

const stagePreviewOutLinkStyles = css({
  border: 'none',
  padding: 0,
  margin: 0,
  background: 'none',
});

type MergeProps = {
  isComplete: boolean,
  hasServerError: boolean,
  isAtlasDeployed: boolean,
  gotoMergeResults: () => void,
  saveDocuments: () => void
};

function MergeSection({
  isComplete,
  hasServerError,
  isAtlasDeployed,
  gotoMergeResults,
  saveDocuments
}: MergeProps) {
  if (isComplete) {
    if (hasServerError) {
      return (<div className={stagePreviewOutStyles} />);
    }

    return (
      <div className={stagePreviewOutStyles}>
        <Body className={stagePreviewOutTextStyles}>
          Documents persisted to collection specified by $merge.
        </Body>
        <Link
          data-testid="go-to-merge-collection"
          as="button"
          className={stagePreviewOutLinkStyles}
          onClick={gotoMergeResults}
        >
          Go to collection.
        </Link>
      </div>
    );
  }

  return (
    <div className={stagePreviewOutStyles}>
      <div className={stagePreviewOutTextStyles}>
        {MERGE_STAGE_PREVIEW_TEXT}
      </div>
      {isAtlasDeployed && (
        <Button
          variant="primary"
          data-testid="save-merge-documents"
          onClick={saveDocuments}
        >
          Merge documents
        </Button>
      )}
    </div>
  );
}

type OutProps = {
  isComplete: boolean,
  hasServerError: boolean,
  isAtlasDeployed: boolean,
  gotoOutResults: () => void,
  saveDocuments: () => void,
  stageValue: string
};

function OutSection({
  isComplete,
  hasServerError,
  isAtlasDeployed,
  gotoOutResults,
  saveDocuments,
  stageValue
}: OutProps) {
    if (isComplete) {
      if (hasServerError) {
        return (<div className={stagePreviewOutStyles} />);
      }

      return (
        <div className={stagePreviewOutStyles}>
          <Body className={stagePreviewOutTextStyles}>
            Documents persisted to collection: {decomment(stageValue)}.
          </Body>
          <Link
            data-testid="go-to-out-collection"
            as="button"
            className={stagePreviewOutLinkStyles}
            onClick={gotoOutResults}
          >
            Go to collection.
          </Link>
        </div>
      );
    }

    return (
      <Body as="div" className={stagePreviewOutStyles}>
        <Body className={stagePreviewOutTextStyles}>
          {OUT_STAGE_PREVIEW_TEXT}
        </Body>
        {isAtlasDeployed && (
          <Button
            variant="primary"
            data-testid="save-out-documents"
            onClick={saveDocuments}
          >
            Save documents
          </Button>
        )}
      </Body>
    );
}

const stagePreviewMissingSearchSupportStyles = css({
  display: 'flex',
  flex: 1,
  justifyContent: 'center'
});

type AtlasOnlySectionProps = {
  stageOperator: string
};

function AtlasOnlySection({ stageOperator }: AtlasOnlySectionProps) {
  return (
    <div className={stagePreviewMissingSearchSupportStyles}>
      <AtlasStagePreview stageOperator={stageOperator} />
    </div>
  );
}

const emptyStyles = css({
  paddingLeft: spacing[3],
  margin: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fill: 'none',
  textAlign: 'center'
});

const emptyStylesDark = css({
  stroke: palette.gray.base
});

const emptyStylesLight = css({
  stroke: palette.gray.base
});

function EmptyIcon() {
  const darkMode = useDarkMode();

  return (<div className={cx(emptyStyles, darkMode ? emptyStylesDark : emptyStylesLight)}>
    <Body>
      <span data-testid="stage-preview-empty">No Preview Documents</span>
    </Body>
  </div>);
}

const documentsStyles = css({
  margin: spacing[2],
  gap: spacing[2],
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  overflowX: 'auto'
});

const documentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  flexShrink: 0,
  width: '384px',
  minHeight: '170px',
  marginBottom: spacing[2]
});

const documentStyles = css({
  flexBasis: '170px',
  flexGrow: 1,
  flexShrink: 0,
  overflow: 'auto',
  padding: 0,
});


type StagePreviewProps = {
  index: number,
  onRunOutStageClick: (index: number) => void,
  onGoToOutResultsClick: (index: number) => void,
  onGoToMergeResultsClick: (index: number) => void,
  stageOperator: string,
  stageValue: string | null,
  isEnabled: boolean,
  isValid: boolean,
  isLoading: boolean,
  documents: DocumentType[] | null;
  isComplete: boolean,
  hasServerError: boolean,
  isAtlasDeployed: boolean,
  isMissingAtlasOnlyStageSupport: boolean
};

function StagePreviewBody({
  index,
  onRunOutStageClick,
  onGoToOutResultsClick,
  onGoToMergeResultsClick,
  stageOperator,
  stageValue,
  isEnabled,
  isValid,
  isLoading,
  documents,
  isComplete,
  hasServerError,
  isAtlasDeployed,
  isMissingAtlasOnlyStageSupport
}: StagePreviewProps) {
  const gotoMergeResults = () => {
    onGoToMergeResultsClick(index);
  };

  const gotoOutResults = () => {
    onGoToOutResultsClick(index);
  };

  const saveDocuments = () => {
    onRunOutStageClick(index);
  };

  if (isMissingAtlasOnlyStageSupport) {
    return <AtlasOnlySection stageOperator={stageOperator} />;
  }

  if (isValid && isEnabled && stageValue) {
    if (stageOperator === '$out') {
      return <OutSection
        isComplete={isComplete}
        hasServerError={hasServerError}
        isAtlasDeployed={isAtlasDeployed}
        gotoOutResults={gotoOutResults}
        saveDocuments={saveDocuments}
        stageValue={stageValue}
      />
    }

    if (stageOperator === '$merge') {
      return <MergeSection
        isComplete={isComplete}
        hasServerError={hasServerError}
        isAtlasDeployed={isAtlasDeployed}
        gotoMergeResults={gotoMergeResults}
        saveDocuments={saveDocuments}
      />
    }

    if (documents && documents.length > 0) {
      const docs = documents.map((doc, i) => {
        return (
          <KeylineCard key={i} className={documentContainerStyles}>
            <div className={documentStyles}>
              <Document doc={doc} editable={false}  />
            </div>
          </KeylineCard>
        );
      });
      return (
        <div className={documentsStyles}>
          {docs}
        </div>
      );
    }
  }

  if (isLoading) {
    // Don't render the empty state when loading.
    return null;
  }

  return (
    <EmptyIcon />
  );
}

function LoadingIndicator({ stageOperator }: { stageOperator: string}) {
    if (['$out', '$merge'].includes(stageOperator)) {
      return (<LoadingOverlay text="Persisting Documents..." />);
    }
    return (<LoadingOverlay text="Loading Preview Documents..." />);
}

const stagePreviewStyles = css({
  width: '100%',
  display: 'flex',
  alignItems: 'stretch',
  overflow: 'auto',
  position: 'relative',
  flexGrow: 1,
});

// exported for tests
export function StagePreview(props: StagePreviewProps) {
  const { isLoading, stageOperator } = props;
  return (
    <div className={stagePreviewStyles}>
      {isLoading && stageOperator && <LoadingIndicator stageOperator={stageOperator} />}
      <StagePreviewBody {...props} />
    </div>
  );
}

export default connect(
  (state: RootState, ownProps: { index: number }) => {
    const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
    const isComplete =
      Boolean(!stage.loading && !stage.serverError && stage.previewDocs);
    const isMissingAtlasOnlyStageSupport = state.env && stage.serverError && isMissingAtlasStageSupport(
      state.env,
      stage.serverError
    );

    return {
      stageOperator: stage.stageOperator as string,
      stageValue: stage.value,
      isEnabled: !stage.disabled,
      isValid: !stage.serverError && !stage.syntaxError,
      isLoading: stage.loading,
      documents: stage.previewDocs,
      hasServerError: !!stage.serverError,
      isAtlasDeployed: state.isAtlasDeployed,
      isComplete,
      isMissingAtlasOnlyStageSupport: !!isMissingAtlasOnlyStageSupport,
    };
  },
  {
    onRunOutStageClick: runStage,
    onGoToOutResultsClick: gotoOutResults,
    onGoToMergeResultsClick: gotoOutResults
  }
)(StagePreview);
