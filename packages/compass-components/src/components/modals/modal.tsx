import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { Body, Modal as LeafyGreenModal } from '../leafygreen';
import { useScrollbars } from '../../hooks/use-scrollbars';
import { withStackedComponentStyles } from '../../hooks/use-stacked-component';

const styles = css({
  width: '600px',
  letterSpacing: 0,
  padding: 0,
  // The LG modal applies transform: translate3d(0, 0, 0) style to the modal
  // content and this messes up the autocompleter within the modal. So we clear
  // the transform here.
  transform: 'none',
});

const fullScreenStyles = css({
  width: '100%',
  height: '100%',
  alignSelf: 'stretch',
  '& > div': {
    height: '100%',
    maxHeight: '100%',
  },
});

function UnwrappedModal({
  backdropClassName,
  className,
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
      backdropClassName={cx(scrollbarStyles, backdropClassName)}
      className={cx(styles, className, {
        [fullScreenStyles]: fullScreen,
      })}
      {...props}
    >
      <Body as="div">{children}</Body>
    </LeafyGreenModal>
  );
}

const Modal = withStackedComponentStyles(UnwrappedModal);
export { Modal };
