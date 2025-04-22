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
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';
import {
  getDestinationNamespaceFromStage,
  isOutputStage,
} from '../../utils/stage';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../constants';
import { usePreference } from 'compass-preferences-model/provider';

const stagePreviewStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[200],
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
  gap: spacing[200],
});

type OutputStageProps = {
  operator: string | null;
  isLoading: boolean;
  hasServerError: boolean;
  isFinishedPersistingDocuments: boolean;
  destinationNamespace: string | null;
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
  destinationNamespace,
  onRunOutputStage,
  onGoToOutputResults,
}: OutputStageProps) => {
  // When explicit pipeline run is not enabled, we allow to run output stage
  // from the preview
  const showOutputActions = !usePreference(
    'enableAggregationBuilderRunPipeline'
  );

  if (!isOutputStage(operator ?? '')) {
    return null;
  }

  // Following states are only allowed when running out stage from the preview
  // card is enabled
  if (showOutputActions) {
    // Stage editor show the error message.
    if (hasServerError) {
      return null;
    }

    if (isLoading) {
      return <Loader destinationNamespace={destinationNamespace} />;
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
  }

  return (
    <div className={stagePreviewStyles}>
      <div className={stagePreviewTextStyles} data-testid="output-stage-text">
        {operator === '$merge'
          ? MERGE_STAGE_PREVIEW_TEXT
          : OUT_STAGE_PREVIEW_TEXT}
      </div>
      {showOutputActions && (
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
  const stage = state.pipelineBuilder.stageEditor.stages[
    ownProps.index
  ] as StoreStage;
  const destinationNamespace = stage.stageOperator
    ? getDestinationNamespaceFromStage(state.namespace, {
        [stage.stageOperator]: stage.value ?? '',
      })
    : null;

  return {
    isLoading: stage.loading,
    hasServerError: !!stage.serverError,
    isFinishedPersistingDocuments: Boolean(stage.previewDocs),
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

export default connect(mapState, mapDispatch)(OutputStage);
