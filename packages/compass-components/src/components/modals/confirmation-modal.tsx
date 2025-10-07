import React from 'react';

import {
  Body,
  ConfirmationModal as LeafyGreenConfirmationModal,
} from '../leafygreen';
import { withStackedComponentStyles } from '../../hooks/use-stacked-component';

export type ConfirmationModalProps = Omit<
  React.ComponentProps<typeof LeafyGreenConfirmationModal>,
  'backdropClassName'
>;

function ConfirmationModal({
  children,
  ...props
}: ConfirmationModalProps): React.ReactElement {
  return (
    <LeafyGreenConfirmationModal {...props}>
      <Body as="div">{children}</Body>
    </LeafyGreenConfirmationModal>
  );
}

export default withStackedComponentStyles(ConfirmationModal);
