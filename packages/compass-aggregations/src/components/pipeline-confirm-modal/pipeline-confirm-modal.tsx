import React from 'react';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import {
  toggleNewPipelineModal,
  confirmNewPipeline,
} from '../../modules/is-new-pipeline-confirm';
import { useTrackOnChange } from '@mongodb-js/compass-logging';

const QUESTION = 'Are you sure you want to create a new pipeline?';

type PipelineConfirmModalProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
  onConfirmNewPipeline: () => void;
};

export const PipelineConfirmModal: React.FunctionComponent<
  PipelineConfirmModalProps
> = ({ isModalOpen, onCloseModal, onConfirmNewPipeline }) => {
  useTrackOnChange(
    'COMPASS-AGGREGATIONS-UI',
    (track) => {
      if (isModalOpen) {
        track('Screen', { name: 'confirm_new_pipeline_modal' });
      }
    },
    [isModalOpen],
    undefined,
    React
  );

  return (
    <ConfirmationModal
      title={QUESTION}
      open={isModalOpen}
      onConfirm={onConfirmNewPipeline}
      onCancel={onCloseModal}
      buttonText="Confirm"
      data-testid="confirm-new-pipeline-modal"
    >
      Creating this pipeline will abandon unsaved changes to the current
      pipeline.
    </ConfirmationModal>
  );
};

const mapState = ({ isNewPipelineConfirm }: RootState) => ({
  isModalOpen: isNewPipelineConfirm,
});

const mapDispatch = {
  onCloseModal: () => toggleNewPipelineModal(false),
  onConfirmNewPipeline: confirmNewPipeline,
};
export default connect(mapState, mapDispatch)(PipelineConfirmModal);
