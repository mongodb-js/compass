import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Body, Modal as LeafyGreenModal } from '../leafygreen';
import { withStackedComponentStyles } from '../../hooks/use-stacked-component';

const styles = css({
  letterSpacing: 0,
  padding: 0,
  // The LG modal applies transform: translate3d(0, 0, 0) style to the modal
  // content and this messes up the autocompleter within the modal. So we clear
  // the transform here.
  transform: 'none',
  '&:not([open])': {
    pointerEvents: 'none',
  },
});

const fullScreenStyles = css({
  top: spacing['600'],
  bottom: spacing['600'],
  left: spacing['800'],
  right: spacing['800'],
  height: 'auto',
  width: 'auto',
  '& > div': {
    height: '100%',
    maxHeight: '100%',
  },
});

function UnwrappedModal({
  className,
  children,
  fullScreen = false,
  ...props
}: Omit<React.ComponentProps<typeof LeafyGreenModal>, 'backdropClassName'> & {
  fullScreen?: boolean;
}): React.ReactElement {
  return (
    <LeafyGreenModal
      className={cx(styles, className, {
        [fullScreenStyles]: fullScreen && props.open,
      })}
      /* For now, we're defaulting to not auto-focus the first focusable element */
      initialFocus={null}
      {...props}
    >
      <Body as="div">{children}</Body>
    </LeafyGreenModal>
  );
}

const Modal = withStackedComponentStyles(UnwrappedModal);
export { Modal };
