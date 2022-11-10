import React, { useState } from 'react';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { connect } from 'react-redux';
import { deletePipeline, openPipelineById } from '../../modules/saved-pipeline';
import {
  Body,
  Button,
  ConfirmationModal,
  css,
  cx,
  Icon,
  KeylineCard,
  spacing
} from '@mongodb-js/compass-components';
import { RootState } from '../../modules';
import { mapPipelineModeToEditorViewType } from '../../modules/pipeline-builder/builder-helpers';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

type SavePipelineCardProps = {
  id: string;
  name: string;
  onOpenPipelineConfirm: () => void;
  onDeletePipeline: () => void;
};

const cardOuter = css({
  margin: spacing[2]
});

const card = css({
  display: 'flex',
  alignItems: 'center',
  padding: spacing[2],
  '&:hover .controls': {
    visibility: 'visible'
  }
});

const controls = css({
  flex: 'none',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
  visibility: 'hidden'
});

const button = css({
  flex: 'none'
});

const SavePipelineCard: React.FunctionComponent<SavePipelineCardProps> = ({
  id,
  name,
  onOpenPipelineConfirm,
  onDeletePipeline
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const onOpenConfirm = () => {
    setShowConfirmModal(false);
    onOpenPipelineConfirm();
  };

  return (
    <>
      <ConfirmationModal
        data-id="open-pipeline-confirmation-modal"
        title="Are you sure you want to open this pipeline?"
        open={showConfirmModal}
        onConfirm={() => {
          onOpenConfirm();
        }}
        onCancel={() => {
          setShowConfirmModal(false);
        }}
        buttonText="Open Pipeline"
        trackingId="restore_pipeline_modal"
        data-testid="restore-pipeline-modal"
      >
        Opening this project will abandon <b>unsaved</b> changes to the current
        pipeline you are building.
      </ConfirmationModal>
      <div className={cardOuter}>
        <KeylineCard
          className={card}
          data-testid="saved-pipeline-card"
          data-pipeline-object-id={id}
        >
          <Body as="div" data-testid="saved-pipeline-card-name">
            {name}
          </Body>
          <div className={cx(controls, 'controls')}>
            <Button
              className={button}
              size="xsmall"
              onClick={() => {
                setShowConfirmModal(true);
              }}
            >
              Open
            </Button>
            <Button
              className={button}
              size="xsmall"
              onClick={onDeletePipeline}
              aria-label="Delete"
            >
              <Icon size="small" glyph="Trash"></Icon>
            </Button>
          </div>
        </KeylineCard>
      </div>
    </>
  );
};

export default connect(
  (state: RootState) => {
    return {
      editor_view_type: mapPipelineModeToEditorViewType(
        state.pipelineBuilder.pipelineMode
      ),
    };
  },
  {
    onOpenPipelineConfirm: openPipelineById,
    onDeletePipeline: deletePipeline,
  },
  (
    mapProps,
    dispatchProps,
    ownProps: Pick<SavePipelineCardProps, 'id' | 'name'>
  ): SavePipelineCardProps => {
    const { editor_view_type } = mapProps;
    const { onDeletePipeline, onOpenPipelineConfirm } = dispatchProps;
    const { id } = ownProps;
    return {
      ...ownProps,
      onDeletePipeline: () => {
        track('Aggregation Deleted', {
          id,
          screen: 'aggregations',
          editor_view_type,
        });
        onDeletePipeline(id);
      },
      onOpenPipelineConfirm: () => {
        track('Aggregation Opened', {
          id,
          screen: 'aggregations',
          editor_view_type,
        });
        onOpenPipelineConfirm(id);
      },
    };
  }
)(SavePipelineCard);
