import React from 'react';
import { connect } from 'react-redux';
import {
  css,
  spacing,
  Body,
  Link,
  Button,
  SpinLoader,
} from '@mongodb-js/compass-components';
import type { PipelineBuilderThunkDispatch, RootState } from '../../modules';
import { viewOutResults } from '../../modules/out-results-fn';
import { runStage } from '../../modules/pipeline-builder/stage-editor';
import {
  getDestinationNamespaceFromStage,
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../utils/stage';
import { parseShellBSON } from '../../modules/pipeline-builder/pipeline-parser/utils';

const stagePreviewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[2],
});

const stagePreviewTextStyles = css({
  textAlign: 'center',
});

const stagePreviewLinkStyles = css({
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
  operator: string | null;
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
};

const Loader = ({
  destinationNamespace,
}: {
  destinationNamespace: string | null;
}) => {
  return (
    <div className={stagePreviewStyles}>
      <div className={loaderStyles}>
        <SpinLoader />
        Persisting Documents{' '}
        {destinationNamespace ? `to ${destinationNamespace}` : '...'}
      </div>
    </div>
  );
};

export const OutputStage = ({
  operator,
  isLoading,
  hasServerError,
  isFinishedPersistingDocuments,
  isAtlasDeployed,
  destinationNamespace,
  onRunOutputStage,
  onGoToOutputResults,
}: OutputStageProps) => {
  if (!['$out', '$merge'].includes(operator || '')) {
    return null;
  }

  if (isLoading) {
    return <Loader destinationNamespace={destinationNamespace} />;
  }

  // Stage editor show the error message.
  if (hasServerError) {
    return null;
  }

  if (isFinishedPersistingDocuments) {
    return (
      <div className={stagePreviewStyles}>
        <Body className={stagePreviewTextStyles}>
          {documentsPersistedText(destinationNamespace)}
        </Body>
        <Link
          data-testid="goto-output-collection"
          as="button"
          className={stagePreviewLinkStyles}
          onClick={onGoToOutputResults}
        >
          Go to collection.
        </Link>
      </div>
    );
  }

  return (
    <div className={stagePreviewStyles}>
      <div className={stagePreviewTextStyles} data-testid="output-stage-text">
        {operator === '$merge'
          ? MERGE_STAGE_PREVIEW_TEXT
          : OUT_STAGE_PREVIEW_TEXT}
      </div>
      {isAtlasDeployed && (
        <Button
          variant="primary"
          data-testid="save-output-documents"
          onClick={onRunOutputStage}
        >
          {operator === '$merge' ? 'Merge Documents' : 'Save Documents'}
        </Button>
      )}
    </div>
  );
};

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
    operator: stage.stageOperator,
  };
};

const mapDispatch = (
  dispatch: PipelineBuilderThunkDispatch,
  ownProps: OwnProps
) => ({
  onRunOutputStage: () => dispatch(runStage(ownProps.index)),
  onGoToOutputResults: () => dispatch(viewOutResults(ownProps.index)),
});

export const MergeStagePreivew = connect(mapState, mapDispatch)(OutputStage);

export const OutStagePreivew = connect(mapState, mapDispatch)(OutputStage);
