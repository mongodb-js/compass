import React from 'react';

import {
  Body,
  ConfirmationModal as LeafyGreenConfirmationModal,
} from '../leafygreen';
import { withZIndex } from '../../utils/with-z-index';

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

export default withZIndex(ConfirmationModal);
