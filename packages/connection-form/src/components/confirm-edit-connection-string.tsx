import React from 'react';
import { ConfirmationModal } from '@mongodb-js/compass-components';

function ConfirmEditConnectionString({
  onCancel,
  onConfirm,
  open,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}): React.ReactElement {
  return (
    <ConfirmationModal
      title="Are you sure you want to edit your connection string?"
      open={open}
      onConfirm={onConfirm}
      onCancel={onCancel}
      buttonText="Confirm"
      data-testid="edit-uri-confirmation-modal"
    >
      <div data-testid="edit-uri-note">
        Editing this connection string will reveal your credentials.
      </div>
    </ConfirmationModal>
  );
}

export default ConfirmEditConnectionString;
