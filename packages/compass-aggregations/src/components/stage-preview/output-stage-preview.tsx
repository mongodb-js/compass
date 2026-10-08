import React from 'react';
import { connect } from 'react-redux';
import {
  css,
  spacing,
  Body,
  Link,
  Button,
  SpinLoader,
  useTranslation,
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

const Loader = ({
  destinationNamespace,
}: {
  destinationNamespace: string | null;
}) => {
  const t = useTranslation();
  return (
    <div className={stagePreviewStyles}>
      <div className={loaderStyles}>
        <SpinLoader />
        {destinationNamespace
          ? t(
              'aggregations.outputStage.persistingTo',
              'Persisting Documents to {destination}',
              { destination: destinationNamespace }
            )
          : t(
              'aggregations.outputStage.persisting',
              'Persisting Documents ...'
            )}
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
  const t = useTranslation();
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
            {destinationNamespace
              ? t(
                  'aggregations.outputStage.persistedToCollection',
                  'Documents persisted to collection: {destination}',
                  { destination: destinationNamespace }
                )
              : t(
                  'aggregations.outputStage.persistedToSpecified',
                  'Documents persisted to specified collection'
                )}
          </Body>
          <Link
            data-testid="goto-output-collection"
            as="button"
            className={stagePreviewLinkStyles}
            onClick={onGoToOutputResults}
          >
            {t(
              'aggregations.outputStage.goToCollectionPeriod',
              'Go to collection.'
            )}
          </Link>
        </div>
      );
    }
  }

  return (
    <div className={stagePreviewStyles}>
      <div className={stagePreviewTextStyles} data-testid="output-stage-text">
        {operator === '$merge'
          ? t('aggregations.outputStage.mergePreview', MERGE_STAGE_PREVIEW_TEXT)
          : t('aggregations.outputStage.outPreview', OUT_STAGE_PREVIEW_TEXT)}
      </div>
      {showOutputActions && (
        <Button
          variant="primary"
          data-testid="save-output-documents"
          onClick={onRunOutputStage}
        >
          {operator === '$merge'
            ? t('aggregations.outputStage.mergeDocuments', 'Merge Documents')
            : t(
                'aggregations.outputStage.saveDocumentsTitle',
                'Save Documents'
              )}
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
