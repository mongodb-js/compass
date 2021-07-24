import React from 'react';
import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';

function ConfirmationModal(props: React.ComponentProps<typeof LeafyGreenConfirmationModal>) {
  return (
    <LeafyGreenConfirmationModal
      {...props}
    />
  );
}

ConfirmationModal.propTypes = LeafyGreenConfirmationModal.propTypes;

export default ConfirmationModal;
