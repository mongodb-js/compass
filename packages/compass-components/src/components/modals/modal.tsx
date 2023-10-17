import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Body, Modal as LeafyGreenModal } from '../leafygreen';
import { useScrollbars } from '../../hooks/use-scrollbars';

const contentStyles = css({
  width: '600px',
  letterSpacing: 0,
  padding: 0,
  // The LG modal applies transform: translate3d(0, 0, 0) style to the modal
  // content and this messes up the autocompleter within the modal. So we clear
  // the transform here.
  transform: 'none',
});

const modalFullScreenStyles = css({
  '& > div': {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    paddingLeft: spacing[5],
    paddingRight: spacing[5],
    height: '100vh',
    maxHeight: '100vh',
  },
});

const contentFullScreenStyles = css({
  width: '100%',
  height: '100%',
  maxHeight: '100%',
  margin: 0,
  alignSelf: 'stretch',
  '& > div': {
    height: '100%',
    maxHeight: '100%',
  },
});

function Modal({
  className,
  contentClassName,
  children,
  fullScreen = false,
  ...props
}: React.ComponentProps<typeof LeafyGreenModal> & {
  fullScreen?: boolean;
}): React.ReactElement {
  // NOTE: We supply scrollbar styles to the `Modal` content as
  // there is currently a bug in `LeafyGreen` with the portal providers
  // where our top level `portalContainer` we supply to the `LeafyGreenProvider`
  // in home.tsx is not used by Modals.
  // Once this issue is fixed we can remove these styles here.
  const { className: scrollbarStyles } = useScrollbars();

  return (
    <LeafyGreenModal
      className={cx(
        scrollbarStyles,
        fullScreen && modalFullScreenStyles,
        className
      )}
      contentClassName={cx(
        contentStyles,
        fullScreen && contentFullScreenStyles,
        contentClassName
      )}
      {...props}
    >
      <Body as="div">{children}</Body>
    </LeafyGreenModal>
  );
}

export { Modal };
