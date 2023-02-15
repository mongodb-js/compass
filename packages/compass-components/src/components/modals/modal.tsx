import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';

import { Body, Modal as LeafyGreenModal } from '../leafygreen';
import { useScrollbars } from '../../hooks/use-scrollbars';

const contentStyles = css({
  width: '600px',
  letterSpacing: 0,
  padding: 0,
});

function Modal({
  className,
  contentClassName,
  children,
  ...props
}: React.ComponentProps<typeof LeafyGreenModal>): React.ReactElement {
  // NOTE: We supply scrollbar styles to the `Modal` content as
  // there is currently a bug in `LeafyGreen` with the portal providers
  // where our top level `portalContainer` we supply to the `LeafyGreenProvider`
  // in home.tsx is not used by Modals.
  // Once this issue is fixed we can remove these styles here.
  const { className: scrollbarStyles } = useScrollbars();

  return (
    <LeafyGreenModal
      className={cx(scrollbarStyles, className)}
      contentClassName={cx(contentStyles, contentClassName)}
      {...props}
    >
      <Body as="div">{children}</Body>
    </LeafyGreenModal>
  );
}

export { Modal };
