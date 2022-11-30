import React, { useEffect } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

import { Modal as LeafyGreenModal } from '../leafygreen';
import { useScrollbars } from '../../hooks/use-scrollbars';

const contentStyles = css({
  width: '600px',
  letterSpacing: 0,
  padding: 0,
});

function Modal({
  trackingId,
  contentClassName,
  className,
  ...props
}: React.ComponentProps<typeof LeafyGreenModal> & {
  trackingId?: string;
}): React.ReactElement {
  const { className: scrollbarStyles } = useScrollbars();

  useEffect(() => {
    if (props.open && trackingId) {
      track('Screen', { name: trackingId });
    }
  }, [props.open, trackingId]);
  return (
    <LeafyGreenModal
      className={cx(scrollbarStyles, className)}
      contentClassName={cx(contentStyles, contentClassName)}
      {...props}
    />
  );
}

export { Modal };
