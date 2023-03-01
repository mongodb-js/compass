import React from 'react';

import {
  Body,
  ConfirmationModal as LeafyGreenConfirmationModal,
} from '../leafygreen';

function ConfirmationModal({
  children,
  ...props
}: React.ComponentProps<
  typeof LeafyGreenConfirmationModal
>): React.ReactElement {
  return (
    <LeafyGreenConfirmationModal {...props}>
      <Body as="div">{children}</Body>
    </LeafyGreenConfirmationModal>
  );
}

export default ConfirmationModal;
