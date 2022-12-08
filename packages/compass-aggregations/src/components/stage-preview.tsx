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
import { AtlastStagePreivew } from './atlas-stage-preview';

const stagePreviewOutStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  paddingTop: spacing[5],
  paddingLeft: spacing[1],
  paddingRight: spacing[1],
  paddingBottom: spacing[2]
});

const stagePreviewOutTextStyles = css({
  padding: `0 ${spacing[3]}px ${spacing[1]}px ${spacing[3]}px`,
  textAlign: 'center',

  // TODO: is this still used?
  '&:not(:last-child)': {
    paddingBottom: '8px'
  }
});

// TODO: double-check that this is actually needed
const stagePreviewOutLinkStyles = css({
  border: 'none',
  padding: 0,
  margin: 0,
  background: 'none'
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

    // TODO: is it still possible to get here? How do we test this?
    return (
      <div className={stagePreviewOutStyles}>
        <div className={stagePreviewOutTextStyles}>
          Documents persisted to collection specified by $merge.
        </div>
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

      // TODO: is it still possible to get here? How do we test this?
      return (
        <Body as="div" className={stagePreviewOutStyles}>
          <div className={stagePreviewOutTextStyles}>
            Documents persisted to collection: {decomment(stageValue)}.
          </div>
          <Link
            data-testid="go-to-out-collection"
            as="button"
            className={stagePreviewOutLinkStyles}
            onClick={gotoOutResults}
          >
            Go to collection.
          </Link>
        </Body>
      );
    }

    return (
      <Body as="div" className={stagePreviewOutStyles}>
        <div className={stagePreviewOutTextStyles}>
          {OUT_STAGE_PREVIEW_TEXT}
        </div>
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
      <AtlastStagePreivew stageOperator={stageOperator} />
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
    <div>
      <svg width="44" height="60" viewBox="0 0 44 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.9297 38.2988C23.4783 35.1247 27.7679 30.0989 32.5375 35.3879"/>
        <path d="M1 10.7831V51.3133L9.61538 59M1 10.7831L35.4615 1L43 5.19277M1 10.7831L10.1538 15.6747M9.61538 59L43 45.7229C39.9487 34.0763 38 22.5957 43 5.19277M9.61538 59C5.5 34.9362 7.46154 20.3333 10.1538 15.6747M43 5.19277L10.1538 15.6747"/>
        <path d="M19.7174 26.7113C19.7734 27.324 19.6719 27.8684 19.4884 28.2491C19.2999 28.6402 19.0726 28.7786 18.9038 28.7941C18.7349 28.8095 18.4862 28.7146 18.2299 28.3642C17.9804 28.0232 17.7818 27.5063 17.7257 26.8935C17.6696 26.2808 17.7711 25.7364 17.9546 25.3557C18.1432 24.9646 18.3704 24.8262 18.5393 24.8107C18.7082 24.7953 18.9568 24.8902 19.2132 25.2406C19.4627 25.5816 19.6613 26.0985 19.7174 26.7113Z" fill="#889397"/>
        <path d="M32.481 23.5351C32.5371 24.1479 32.4356 24.6923 32.2521 25.0729C32.0636 25.464 31.8363 25.6025 31.6674 25.6179C31.4985 25.6334 31.2499 25.5385 30.9935 25.1881C30.744 24.847 30.5454 24.3301 30.4894 23.7174C30.4333 23.1046 30.5348 22.5602 30.7183 22.1796C30.9068 21.7885 31.1341 21.65 31.303 21.6346C31.4719 21.6191 31.7205 21.714 31.9769 22.0644C32.2264 22.4055 32.425 22.9224 32.481 23.5351Z" fill="#889397"/>
      </svg>
    </div>
    <div>
      <i data-testid="stage-preview-empty">No Preview Documents</i>
    </div>
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

function StagePreview(props: StagePreviewProps) {
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
