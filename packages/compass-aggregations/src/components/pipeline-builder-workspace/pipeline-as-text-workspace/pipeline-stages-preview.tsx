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
} from '../../../constants';
import { usePreference } from 'compass-preferences-model';

const bannerStyles = css({
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
  stageOperator: '$out' | '$merge' | null;
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
  'data-testid': dataTestId,
}: {
  text: string;
  actionButton: JSX.Element | null;
  'data-testid'?: string;
}) => {
  return (
    <Banner
      data-testid={dataTestId}
      variant={BannerVariant.Info}
      className={bannerStyles}
    >
      <div className={contentStyles}>
        <Body>{text}</Body>
        {actionButton}
      </div>
    </Banner>
  );
};

export const OutputStagePreview = ({
  stageOperator,
  isLoading,
  isComplete,
  onSaveCollection,
  onOpenCollection,
}: OutputStageProps) => {
  // When explicit pipeline run is not enabled, we allow to run output stage
  // from the preview
  const showOutputActions = !usePreference(
    'enableAggregationBuilderRunPipeline',
    React
  );

  if (!stageOperator) {
    return null;
  }

  if (isComplete && showOutputActions) {
    return (
      <PipelineStageBanner
        data-testid={`${stageOperator}-is-complete-banner`}
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
      data-testid={`${stageOperator}-preview-banner`}
      text={
        stageOperator === '$out'
          ? OUT_STAGE_PREVIEW_TEXT
          : MERGE_STAGE_PREVIEW_TEXT
      }
      actionButton={
        showOutputActions ? (
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
  pipelineBuilder: {
    textEditor: {
      outputStage: { isComplete, isLoading },
    },
  },
}: RootState) => {
  return {
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
