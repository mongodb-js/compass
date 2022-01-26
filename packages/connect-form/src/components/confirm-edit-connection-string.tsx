import React from 'react';
import { useUiKitContext } from '../contexts/ui-kit-context';

function ConfirmEditConnectionString({
  onCancel,
  onConfirm,
  open,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}): React.ReactElement {
  const { ConfirmationModal } = useUiKitContext();

  return (
    <ConfirmationModal
      title="Are you sure you want to edit your connection string?"
      open={open}
      onConfirm={onConfirm}
      onCancel={onCancel}
      buttonText="Confirm"
    >
      <div data-testid="edit-uri-note">
        Editing this connection string will reveal your credentials.
      </div>
    </ConfirmationModal>
  );
}

export default ConfirmEditConnectionString;
