import React from 'react';
import { Body, Button, css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import { runPipelineWithOutputStage } from '../../../modules/pipeline-builder/text-editor';
import { MERGE_STAGE_PREVIEW_TEXT, OUT_STAGE_PREVIEW_TEXT } from '../../../utils/stage';
import { gotoOutResults } from '../../../modules/out-results-fn';

const container = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
  alignItems: 'center',
});

const PipelineStagePreview = ({
  text,
  showActionButton,
  actionButtonText,
  onClickActionButton,
}: {
  text: string;
  showActionButton: boolean;
  actionButtonText: string;
  onClickActionButton: () => void;
}) => {
  return (
    <div className={container}>
      <Body>{text}</Body>
      {showActionButton && (
        <Button variant="primary" onClick={onClickActionButton}>
          {actionButtonText}
        </Button>
      )}
    </div>
  );
};

const OutStage = ({
  isAtlas,
  isComplete,
  stageIndex,
  onSaveCollection,
  onOpenCollection,
}: {
  isAtlas: boolean;
  isComplete: boolean;
  stageIndex: number;
  onSaveCollection: () => void;
  onOpenCollection: (index: number) => void;
}) => {
  if (isComplete) {
    return (
      <PipelineStagePreview
        text={'Documents persisted to collection specified by $out.'}
        showActionButton={isAtlas}
        actionButtonText={'Go to collection'}
        onClickActionButton={() => onOpenCollection(stageIndex)}
      />
    );
  }

  return (
    <PipelineStagePreview
      text={OUT_STAGE_PREVIEW_TEXT}
      showActionButton={isAtlas}
      actionButtonText={'Save documents'}
      onClickActionButton={onSaveCollection}
    />
  );
};

const MergeStage = ({
  isAtlas,
  isComplete,
  stageIndex,
  onSaveCollection,
  onOpenCollection,
}: {
  isAtlas: boolean;
  isComplete: boolean;
  stageIndex: number;
  onSaveCollection: () => void;
  onOpenCollection: (index: number) => void;
}) => {
  if (isComplete) {
    return (
      <PipelineStagePreview
        text={'Documents persisted to collection specified by $merge.'}
        showActionButton={isAtlas}
        actionButtonText={'Go to collection'}
        onClickActionButton={() => onOpenCollection(stageIndex)}
      />
    );
  }

  return (
    <PipelineStagePreview
      text={MERGE_STAGE_PREVIEW_TEXT}
      showActionButton={isAtlas}
      actionButtonText={'Merge documents'}
      onClickActionButton={onSaveCollection}
    />
  );
};

const mapState = ({
  isAtlasDeployed,
  pipelineBuilder: {
    textEditor: { loading, serverError, previewDocs, stageOperators },
  },
}: RootState) => {
  console.log({ previewDocs });
  return {
    isAtlas: true,
    isComplete: !loading && !serverError && previewDocs !== null,
    stageIndex: stageOperators.length - 1,
  };
};
const mapDispatch = {
  onSaveCollection: runPipelineWithOutputStage,
  onOpenCollection: (index: number) => gotoOutResults(index),
};
export const OutStagePreview = connect(mapState, mapDispatch)(OutStage);
export const MergeStagePreview = connect(mapState, mapDispatch)(MergeStage);
