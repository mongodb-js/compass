import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Link,
  Tooltip,
  useAsyncValue,
} from '@mongodb-js/compass-components';
import { usePreferences } from '@mongodb-js/compass-preferences-model/provider';
import type { RootState } from '../../modules';
import { getStageDestination, getStageInfo } from '../../utils/stage';
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

export type StagePreviewHeaderProps = {
  index: number;
  namespace: string;
  stageOperator?: string | null;
  stageValue?: string | null;
  previewSize?: number;
  description?: string;
  link?: string | null;
};

function StagePreviewHeaderInner({
  namespace,
  stageOperator,
  stageValue,
  previewSize,
  description,
  link,
}: StagePreviewHeaderProps) {
  const { value, pending } = useAsyncValue(
    () => getStageDestination(namespace, stageOperator ?? null, stageValue),
    [namespace, stageOperator, stageValue]
  );
  // Ignore the retained value so we never show the previous stage's target
  const destination = pending ? null : value;

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
      stage.stageOperator,
      ownProps.enableAutoEmbeddingPublicPreview
    );
    return {
      namespace: state.namespace,
      stageOperator: stage.stageOperator,
      stageValue: stage.value,
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
