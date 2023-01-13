import React, { useEffect } from 'react';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

import {
  Body,
  ConfirmationModal as LeafyGreenConfirmationModal,
} from '../leafygreen';

function ConfirmationModal({
  trackingId,
  children,
  ...props
}: React.ComponentProps<typeof LeafyGreenConfirmationModal> & {
  trackingId?: string;
}): React.ReactElement {
  useEffect(() => {
    if (props.open && trackingId) {
      track('Screen', { name: trackingId });
    }
  }, [props.open, trackingId]);
  return (
    <LeafyGreenConfirmationModal data-testid={trackingId} {...props}>
      <Body as="div">{children}</Body>
    </LeafyGreenConfirmationModal>
  );
}

export default ConfirmationModal;
