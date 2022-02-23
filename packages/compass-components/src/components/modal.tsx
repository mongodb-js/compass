import React, { useEffect } from 'react';
import LeafyGreenModal from '@leafygreen-ui/modal';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

function Modal({
  trackingId,
  ...props
}: React.ComponentProps<typeof LeafyGreenModal> & {
  trackingId?: string;
}): React.ReactElement {
  useEffect(() => {
    if (props.open && trackingId) {
      track('Screen', { name: trackingId });
    }
  }, [props.open, trackingId]);
  return <LeafyGreenModal {...props} />;
}

export { Modal };
