import React from 'react';
import { ConfirmationModal } from '@mongodb-js/compass-components';

export const OpenPipelineConfirmationModal: React.FunctionComponent<{
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onCancel, onConfirm }) => {
  return (
    <ConfirmationModal
      data-id="open-pipeline-confirmation-modal"
      title="Are you sure you want to open this pipeline?"
      open={isOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      buttonText="Open Pipeline"
      trackingId="restore_pipeline_modal"
      data-testid="restore-pipeline-modal"
    >
      Opening this project will abandon <b>unsaved</b> changes to the current
      pipeline you are building.
    </ConfirmationModal>
  );
};

export const DeletePipelineConfirmationModal: React.FunctionComponent<{
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onCancel, onConfirm }) => {
  return (
    <ConfirmationModal
      data-id="delete-pipeline-confirmation-modal"
      title="Are you sure you want to delete this pipeline?"
      open={isOpen}
      onConfirm={onConfirm}
      onCancel={onCancel}
      buttonText="Delete Pipeline"
      trackingId="delete_pipeline_modal"
      data-testid="delete-pipeline-modal"
    >
      Deleting this pipeline will remove it from your saved pipelines.
    </ConfirmationModal>
  );
};


