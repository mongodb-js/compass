import React, { useEffect } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-UI');

import { Modal as LeafyGreenModal } from './leafygreen';

const variantStyles = {
  'with-footer': css({
    width: '600px',
    padding: 0,
    letterSpacing: 0,
  }),
  'without-footer': css({
    width: '600px',
    padding: 0,
    paddingBottom: spacing[5],
    letterSpacing: 0,
  }),
};

function Modal({
  trackingId,
  contentVariant,
  contentClassName,
  ...props
}: React.ComponentProps<typeof LeafyGreenModal> & {
  trackingId?: string;
  contentVariant?: keyof typeof variantStyles;
}): React.ReactElement {
  useEffect(() => {
    if (props.open && trackingId) {
      track('Screen', { name: trackingId });
    }
  }, [props.open, trackingId]);
  return (
    <LeafyGreenModal
      contentClassName={cx(
        contentVariant && variantStyles[contentVariant],
        contentClassName
      )}
      {...props}
    />
  );
}

export { Modal };
