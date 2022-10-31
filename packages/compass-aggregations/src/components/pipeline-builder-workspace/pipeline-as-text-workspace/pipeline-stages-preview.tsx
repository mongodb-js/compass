import React from 'react';
import {
  Body,
  Button,
  Banner,
  BannerVariant,
  css,
  spacing,
  SpinLoader,
  Icon,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import { runPipelineWithOutputStage } from '../../../modules/pipeline-builder/text-editor-output-stage';
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

type OutputStageProps = {
  isAtlas: boolean;
  isLoading: boolean;
  isComplete: boolean;
  stageIndex: number;
  onSaveCollection: () => void;
  onOpenCollection: (index: number) => void;
};

const ActionButton = ({
  isLoading,
  onClick,
  text,
}: {
  text: string;
  isLoading: boolean;
  onClick: () => void;
}) => {
  const icon = isLoading ? (
    <SpinLoader title="Loading" />
  ) : (
    <Icon glyph="Plus" />
  );
  return (
    <Button
      disabled={isLoading}
      className={actionButtonStyles}
      size="xsmall"
      variant="default"
      onClick={onClick}
      leftGlyph={icon}
    >
      {text}
    </Button>
  );
};

const PipelineStageBanner = ({
  text,
  actionButton,
}: {
  text: string;
  actionButton: JSX.Element | null;
}) => {
  return (
    <Banner variant={BannerVariant.Info} className={bannerStyles}>
      <div className={contentStyles}>
        <Body>{text}</Body>
        {actionButton}
      </div>
    </Banner>
  );
};

const OutStage = ({
  isAtlas,
  isLoading,
  isComplete,
  stageIndex,
  onSaveCollection,
  onOpenCollection,
}: OutputStageProps) => {
  if (isComplete && isAtlas) {
    return (
      <PipelineStageBanner
        text={'Documents persisted to collection specified by $out.'}
        actionButton={
          <ActionButton
            text="Go to collection"
            onClick={() => onOpenCollection(stageIndex)}
          />
        }
      />
    );
  }

  return (
    <PipelineStageBanner
      text={OUT_STAGE_PREVIEW_TEXT}
      actionButton={
        isAtlas ? (
          <ActionButton
            isLoading={isLoading}
            text="Save documents"
            onClick={onSaveCollection}
          />
        ) : null
      }
    />
  );
};

const MergeStage = ({
  isAtlas,
  isLoading,
  isComplete,
  stageIndex,
  onSaveCollection,
  onOpenCollection,
}: OutputStageProps) => {
  if (isComplete && isAtlas) {
    return (
      <PipelineStageBanner
        text={'Documents persisted to collection specified by $merge.'}
        actionButton={
          <ActionButton
            isLoading={isLoading}
            text="Go to collection"
            onClick={() => onOpenCollection(stageIndex)}
          />
        }
      />
    );
  }

  return (
    <PipelineStageBanner
      text={MERGE_STAGE_PREVIEW_TEXT}
      actionButton={
        isAtlas ? (
          <ActionButton
            isLoading={isLoading}
            text="Merge documents"
            onClick={onSaveCollection}
          />
        ) : null
      }
    />
  );
};

const mapState = ({
  isAtlasDeployed,
  pipelineBuilder: {
    textEditor: { stageOperators },
    outputStage: { isComplete, isLoading },
  },
}: RootState) => {
  return {
    isAtlas: isAtlasDeployed,
    isComplete,
    isLoading,
    stageIndex: stageOperators.length - 1, // $out or $merge is always last.
  };
};
const mapDispatch = {
  onSaveCollection: runPipelineWithOutputStage,
  onOpenCollection: (index: number) => gotoOutResults(index),
};
export const OutStageBanner = connect(mapState, mapDispatch)(OutStage);
export const MergeStageBanner = connect(mapState, mapDispatch)(MergeStage);
