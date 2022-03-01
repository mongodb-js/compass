import React, { useEffect } from 'react';
import LeafyGreenConfirmationModal from '@leafygreen-ui/confirmation-modal';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

function ConfirmationModal({
  trackingId,
  ...props
}: React.ComponentProps<typeof LeafyGreenConfirmationModal> & {
  trackingId?: string;
}): React.ReactElement {
  useEffect(() => {
    if (props.open && trackingId) {
      track('Screen', { name: trackingId });
    }
  }, [props.open, trackingId]);
  return <LeafyGreenConfirmationModal data-testid={trackingId} {...props} />;
}

export default ConfirmationModal;
