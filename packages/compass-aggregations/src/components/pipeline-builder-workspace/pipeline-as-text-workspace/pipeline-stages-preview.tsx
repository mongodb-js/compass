import React from 'react';
import {
  Body,
  Button,
  Banner,
  BannerVariant,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import { runPipelineWithOutputStage } from '../../../modules/pipeline-builder/text-editor';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../../utils/stage';
import { gotoOutResults } from '../../../modules/out-results-fn';

const bannerStyles = css({
  margin: spacing[2],
  alignItems: 'center',
  display: 'flex',
});

const contentStyles = css({
  display: 'flex',
  gap: spacing[3],
  alignItems: 'center',
  justifyContent: 'space-between',
});

const actionButtonStyles = css({
  flexShrink: 0,
});

const PipelineStageBanner = ({
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
    <Banner variant={BannerVariant.Info} className={bannerStyles}>
      <div className={contentStyles}>
        <Body>{text}</Body>
        {showActionButton && (
          <Button
            className={actionButtonStyles}
            size="xsmall"
            variant="default"
            onClick={onClickActionButton}
          >
            {actionButtonText}
          </Button>
        )}
      </div>
    </Banner>
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
      <PipelineStageBanner
        text={'Documents persisted to collection specified by $out.'}
        showActionButton={isAtlas}
        actionButtonText={'Go to collection'}
        onClickActionButton={() => onOpenCollection(stageIndex)}
      />
    );
  }

  return (
    <PipelineStageBanner
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
      <PipelineStageBanner
        text={'Documents persisted to collection specified by $merge.'}
        showActionButton={isAtlas}
        actionButtonText={'Go to collection'}
        onClickActionButton={() => onOpenCollection(stageIndex)}
      />
    );
  }

  return (
    <PipelineStageBanner
      text={MERGE_STAGE_PREVIEW_TEXT}
      showActionButton={isAtlas}
      actionButtonText={'Merge documents'}
      onClickActionButton={onSaveCollection}
    />
  );
};

const mapState = ({
  // isAtlasDeployed,
  pipelineBuilder: {
    textEditor: { loading, serverError, previewDocs, stageOperators },
  },
}: RootState) => {
  console.log({ previewDocs });
  return {
    isAtlas: true,
    isComplete: !loading && !serverError && previewDocs !== null,
    stageIndex: stageOperators.length - 1, // $out or $merge is always last.
  };
};
const mapDispatch = {
  onSaveCollection: runPipelineWithOutputStage,
  onOpenCollection: (index: number) => gotoOutResults(index),
};
export const OutStageBanner = connect(mapState, mapDispatch)(OutStage);
export const MergeStageBanner = connect(mapState, mapDispatch)(MergeStage);
