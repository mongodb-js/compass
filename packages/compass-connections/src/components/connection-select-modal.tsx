import React, { useCallback } from 'react';
import { css, spacing, FormModal } from '@mongodb-js/compass-components';
import { ConnectionSelect } from './connection-select';

const modalContentStyles = css({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
});

const connectionSelectStyles = css({
  marginTop: spacing[600],
  width: '300px',
});

export type ConnectionSelectModalProps = {
  modalTitle?: string;
  descriptionText?: React.ReactNode;
  isModalOpen: boolean;
  isSubmitDisabled: boolean;
  submitButtonText: string;
  connections: { id: string; name: string; color?: string }[];
  selectedConnectionId: string;

  onClose(): void;
  onSubmit(): void;
  onConnectionSelected(connectionId: string): void;
};

export const ConnectionSelectModal: React.FunctionComponent<
  ConnectionSelectModalProps
> = ({
  modalTitle = 'Select a Connection',
  isModalOpen,
  descriptionText,
  isSubmitDisabled,
  submitButtonText,
  connections,
  selectedConnectionId,
  onClose,
  onSubmit,
  onConnectionSelected,
}) => {
  const handleClose = useCallback(() => onClose(), [onClose]);
  const handleSubmit = useCallback(() => onSubmit(), [onSubmit]);
  return (
    <FormModal
      scroll={false} // this is so that the selects can hang over the footer and out of the modal
      open={isModalOpen}
      title={modalTitle}
      submitButtonText={submitButtonText}
      submitDisabled={isSubmitDisabled}
      onCancel={handleClose}
      onSubmit={handleSubmit}
      data-testid="select-connection-modal"
    >
      <div className={modalContentStyles}>
        {descriptionText && <div>{descriptionText}</div>}
        <div className={connectionSelectStyles}>
          <ConnectionSelect
            selectedConnectionId={selectedConnectionId}
            connections={connections}
            onConnectionSelected={onConnectionSelected}
          />
        </div>
      </div>
    </FormModal>
  );
};
