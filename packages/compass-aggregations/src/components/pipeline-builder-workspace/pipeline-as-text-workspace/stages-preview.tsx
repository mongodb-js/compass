import React from 'react';
import {
  Body,
  Button,
  Banner,
  BannerVariant,
  css,
  spacing,
  SpinLoader,
  ButtonVariant,
  ButtonSize,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { RootState } from '../../../modules';
import {
  runPipelineWithOutputStage,
  gotoOutputStageCollection,
} from '../../../modules/pipeline-builder/text-editor-output-stage';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../../utils/stage';

const bannerStyles = css({
  margin: spacing[3],
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
  stageOperator: '$out' | '$merge';
  isAtlas: boolean;
  isLoading: boolean;
  isComplete: boolean;
  onSaveCollection: () => void;
  onOpenCollection: () => void;
};

const buttonProps = {
  className: actionButtonStyles,
  size: ButtonSize.XSmall,
  variant: ButtonVariant.Default,
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

const OutputStagePreview = ({
  stageOperator,
  isAtlas,
  isLoading,
  isComplete,
  onSaveCollection,
  onOpenCollection,
}: OutputStageProps) => {
  if (isComplete && isAtlas) {
    return (
      <PipelineStageBanner
        text={`Documents persisted to collection specified by ${stageOperator}.`}
        actionButton={
          <Button {...buttonProps} onClick={onOpenCollection}>
            Go to collection
          </Button>
        }
      />
    );
  }

  const icon = isLoading ? <SpinLoader title="Loading" /> : undefined;
  return (
    <PipelineStageBanner
      text={
        stageOperator === '$out'
          ? OUT_STAGE_PREVIEW_TEXT
          : MERGE_STAGE_PREVIEW_TEXT
      }
      actionButton={
        isAtlas ? (
          <Button
            {...buttonProps}
            disabled={isLoading}
            onClick={onSaveCollection}
            leftGlyph={icon}
          >
            Save documents
          </Button>
        ) : null
      }
    />
  );
};

const mapState = ({
  isAtlasDeployed,
  pipelineBuilder: {
    outputStage: { isComplete, isLoading },
  },
}: RootState) => {
  return {
    isAtlas: isAtlasDeployed,
    isComplete,
    isLoading,
  };
};
const mapDispatch = {
  onSaveCollection: runPipelineWithOutputStage,
  onOpenCollection: gotoOutputStageCollection,
};
export const OutputStageBanner = connect(
  mapState,
  mapDispatch
)(OutputStagePreview);
