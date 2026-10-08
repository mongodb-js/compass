import { renderTemplate } from '../../utils/render-template';
import React from 'react';
import { connect } from 'react-redux';
import {
  Body,
  Link,
  Tooltip,
  useTranslation,
} from '@mongodb-js/compass-components';
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

export type StagePreviewHeaderProps = {
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
  const t = useTranslation();
  if (!stageOperator) {
    return null;
  }
  return (
    <Body>
      {destination ? (
        t(
          'aggregations.preview.documentsSavedTo',
          'Documents will be saved to {destination}.',
          { destination }
        )
      ) : (
        <>
          <span>
            {renderTemplate(
              t(
                'aggregations.preview.outputAfterStage',
                'Output preview after {operator} stage'
              ),
              {
                operator: (
                  <OperatorLink
                    stageOperator={stageOperator}
                    description={description}
                    link={link ?? undefined}
                  ></OperatorLink>
                ),
              }
            )}
          </span>{' '}
          <span data-testid="stage-preview-toolbar-tooltip">
            {previewSize !== 1
              ? t(
                  'aggregations.preview.sampleOther',
                  '(Sample of {count} documents)',
                  { count: previewSize ?? 0 }
                )
              : t(
                  'aggregations.preview.sampleOne',
                  '(Sample of {count} document)',
                  { count: previewSize ?? 0 }
                )}
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
