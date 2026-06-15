import React from 'react';
import { connect } from 'react-redux';
import { Body, Link, Tooltip } from '@mongodb-js/compass-components';
import { usePreferences } from 'compass-preferences-model/provider';
import type { RootState } from '../../modules';
import { getStageInfo } from '../../utils/stage';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

const OperatorLink: React.FunctionComponent<{
  stageOperator: string;
  description?: string;
  link?: string;
}> = ({ stageOperator, description, link }) => {
  return (
    <span>
      <Tooltip
        enabled={!!description}
        trigger={
          <Link
            data-testid="stage-preview-toolbar-link"
            target="_blank"
            href={link}
          >
            {stageOperator}
          </Link>
        }
      >
        {description}
      </Tooltip>
    </span>
  );
};

type StagePreviewHeaderProps = {
  index: number;
  stageOperator?: string | null;
  previewSize?: number;
  description?: string;
  link?: string | null;
  destination?: string | null;
};

function StagePreviewHeaderInner({
  stageOperator,
  previewSize,
  description,
  link,
  destination,
}: StagePreviewHeaderProps) {
  if (!stageOperator) {
    return null;
  }
  return (
    <Body>
      {destination ? (
        `Documents will be saved to ${destination}.`
      ) : (
        <>
          <span>
            Output preview after{' '}
            <OperatorLink
              stageOperator={stageOperator}
              description={description}
              link={link ?? undefined}
            ></OperatorLink>{' '}
            stage
          </span>{' '}
          <span data-testid="stage-preview-toolbar-tooltip">
            (Sample of {previewSize}{' '}
            {previewSize !== 1 ? 'documents' : 'document'})
          </span>
        </>
      )}
    </Body>
  );
}

const ConnectedStagePreviewHeader = connect(
  (
    state: RootState,
    ownProps: { index: number; enableAutoEmbeddingPublicPreview: boolean }
  ) => {
    const stage = state.pipelineBuilder.stageEditor.stages[
      ownProps.index
    ] as StoreStage;
    const stageInfo = getStageInfo(
      state.namespace,
      stage.stageOperator,
      stage.value,
      ownProps.enableAutoEmbeddingPublicPreview
    );
    return {
      stageOperator: stage.stageOperator,
      previewSize: stage.previewDocs?.length ?? 0,
      ...stageInfo,
    };
  }
)(StagePreviewHeaderInner);

export default function StagePreviewHeader(props: { index: number }) {
  const { enableAutoEmbeddingPublicPreview } = usePreferences([
    'enableAutoEmbeddingPublicPreview',
  ]);
  return (
    <ConnectedStagePreviewHeader
      index={props.index}
      enableAutoEmbeddingPublicPreview={Boolean(
        enableAutoEmbeddingPublicPreview
      )}
    />
  );
}
