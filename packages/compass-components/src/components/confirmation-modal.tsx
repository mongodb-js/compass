import React from 'react';
import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

function ConfirmationModal(
  props: React.ComponentProps<typeof LeafyGreenConfirmationModal> & {
    trackingId?: string;
  }
): React.ReactElement {
  if (props.open && props.trackingId) {
    track('Screen', { name: props.trackingId });
  }
  return <LeafyGreenConfirmationModal {...props} />;
}

export default ConfirmationModal;
