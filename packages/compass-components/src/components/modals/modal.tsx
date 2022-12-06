import React, { useEffect } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

import { Body, Modal as LeafyGreenModal } from '../leafygreen';

const contentStyles = css({
  width: '600px',
  letterSpacing: 0,
  padding: 0,
});

function Modal({
  trackingId,
  contentClassName,
  children,
  ...props
}: React.ComponentProps<typeof LeafyGreenModal> & {
  trackingId?: string;
}): React.ReactElement {
  useEffect(() => {
    if (props.open && trackingId) {
      track('Screen', { name: trackingId });
    }
  }, [props.open, trackingId]);
  return (
    <LeafyGreenModal
      contentClassName={cx(contentStyles, contentClassName)}
      {...props}
    >
      <Body as="div">{children}</Body>
    </LeafyGreenModal>
  );
}

export { Modal };
