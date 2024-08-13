import React from 'react';
import { connect } from 'react-redux';
import { Body, Link, Tooltip, css } from '@mongodb-js/compass-components';
import type { RootState } from '../../modules';
import { getStageInfo } from '../../utils/stage';
import type { StoreStage } from '../../modules/pipeline-builder/stage-editor';

const toolbarTextStyles = css({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

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

function StagePreviewHeader({
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
    <Body className={toolbarTextStyles}>
      {destination ? (
        `Documents will be saved to ${destination}.`
      ) : (
        <>
          <span>
            Output after{' '}
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

export default connect((state: RootState, ownProps: { index: number }) => {
  const stage = state.pipelineBuilder.stageEditor.stages[
    ownProps.index
  ] as StoreStage;
  const stageInfo = getStageInfo(
    state.namespace,
    stage.stageOperator,
    stage.value
  );
  return {
    stageOperator: stage.stageOperator,
    previewSize: stage.previewDocs?.length ?? 0,
    ...stageInfo,
  };
})(StagePreviewHeader);
