import React from 'react';
import { ConfirmationModal } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import { setIsNewPipelineConfirm, confirmNewPipeline } from '../../modules/is-new-pipeline-confirm';

const QUESTION = 'Are you sure you want to create a new pipeline?';

type PipelineConfirmModalProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
  onConfirmNewPipeline: () => void;
};

export const PipelineConfirmModal: React.FunctionComponent<PipelineConfirmModalProps> = ({
  isModalOpen,
  onCloseModal,
  onConfirmNewPipeline,
}) => {
  return (
    <ConfirmationModal
      title={QUESTION}
      open={isModalOpen}
      onConfirm={onConfirmNewPipeline}
      onCancel={onCloseModal}
      buttonText="Confirm"
      trackingId="confirm_new_pipeline_modal"
      data-testid="confirm-new-pipeline-modal"
    >
      Creating this pipeline will abandon unsaved changes to the current pipeline.
    </ConfirmationModal>
  );
};

const mapState = ({
  isNewPipelineConfirm
}: RootState) => ({
  isModalOpen: isNewPipelineConfirm,
});

const mapDispatch = {
  onCloseModal: () => setIsNewPipelineConfirm(false),
  onConfirmNewPipeline: confirmNewPipeline,
};
export default connect(mapState, mapDispatch)(PipelineConfirmModal);
