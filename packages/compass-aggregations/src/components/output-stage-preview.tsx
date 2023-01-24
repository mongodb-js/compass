import React from 'react';
import { connect } from 'react-redux';
import { css, spacing, Body, Link, Button, SpinLoader } from '@mongodb-js/compass-components';
import type { PipelineBuilderThunkDispatch, RootState } from '../modules';
import { viewOutResults } from '../modules/out-results-fn';
import { runStage } from '../modules/pipeline-builder/stage-editor';
import {
  getDestinationNamespaceFromStage,
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../utils/stage';
import { parseShellBSON } from '../modules/pipeline-builder/pipeline-parser/utils';

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

const loaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

type OutputStageProps = {
  isLoading: boolean;
  hasServerError: boolean;
  isFinishedPersistingDocuments: boolean;
  isAtlasDeployed: boolean;
  destinationNamespace: string;
  onRunOutputStage: () => void;
  onGoToOutputResults: () => void;
};

const documentsPersistedText = (destination: string | null) => {
  const location = destination
    ? `collection: ${destination}`
    : `specified collection`;
  return `Documents persisted to ${location}`;
}

const Loader = ({
  destinationNamespace,
}: {
  destinationNamespace: string | null;
}) => {
  return (
    <div className={stagePreviewOutStyles}>
      <div className={loaderStyles}>
        <SpinLoader />
        Persisting Documents {
          destinationNamespace
          ? `to ${destinationNamespace}`
          : '...'
        }
      </div>
    </div>
  )
};

export const MergeStage = ({
  isLoading,
  hasServerError,
  isFinishedPersistingDocuments,
  isAtlasDeployed,
  destinationNamespace,
  onRunOutputStage,
  onGoToOutputResults,
}: OutputStageProps) => {

  if (isLoading) {
    return <Loader destinationNamespace={destinationNamespace} />;
  }

  // Stage editor show the error message.
  if (hasServerError) {
    return null;
  }

  if (isFinishedPersistingDocuments) {
    return (
      <div className={stagePreviewOutStyles}>
        <Body className={stagePreviewOutTextStyles}>
          {documentsPersistedText(destinationNamespace)}
        </Body>
        <Link
          data-testid="go-to-merge-collection"
          as="button"
          className={stagePreviewOutLinkStyles}
          onClick={onGoToOutputResults}
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
          onClick={onRunOutputStage}
        >
          Merge documents
        </Button>
      )}
    </div>
  );
}

export const OutStage = ({
  isLoading,
  hasServerError,
  isFinishedPersistingDocuments,
  isAtlasDeployed,
  destinationNamespace,
  onRunOutputStage,
  onGoToOutputResults,
}: OutputStageProps) => {

  if (isLoading) {
    return <Loader destinationNamespace={destinationNamespace} />;
  }

  // Stage editor show the error message.
  if (hasServerError) {
    return null;
  }

  if (isFinishedPersistingDocuments) {
    return (
      <div className={stagePreviewOutStyles}>
        <Body className={stagePreviewOutTextStyles}>
          {documentsPersistedText(destinationNamespace)}
        </Body>
        <Link
          data-testid="go-to-out-collection"
          as="button"
          className={stagePreviewOutLinkStyles}
          onClick={onGoToOutputResults}
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
          onClick={onRunOutputStage}
        >
          Save documents
        </Button>
      )}
    </Body>
  );
}

type OwnProps = {
  index: number;
};

const mapState = (state: RootState, ownProps: OwnProps) => {
  const stage = state.pipelineBuilder.stageEditor.stages[ownProps.index];
  const destinationNamespace = getDestinationNamespaceFromStage(
    state.namespace,
    parseShellBSON(`{
      ${stage.stageOperator as string}: ${stage.value ?? ''}
    }`)
  );

  return {
    isLoading: stage.loading,
    hasServerError: !!stage.serverError,
    isFinishedPersistingDocuments: Boolean(stage.previewDocs),
    isAtlasDeployed: state.isAtlasDeployed,
    destinationNamespace,
  };
};

const mapDispatch = (dispatch: PipelineBuilderThunkDispatch, ownProps: OwnProps) => ({
  onRunOutputStage: () => dispatch(runStage(ownProps.index)),
  onGoToOutputResults: () => dispatch(viewOutResults(ownProps.index)),
});

export const MergeStagePreivew = connect(
  mapState,
  mapDispatch
)(MergeStage);

export const OutStagePreivew = connect(
  mapState,
  mapDispatch
)(OutStage);