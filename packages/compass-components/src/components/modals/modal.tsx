import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';
import { Body, Modal as LeafyGreenModal } from '../leafygreen';
import { withStackedComponentStyles } from '../../hooks/use-stacked-component';

const styles = css({
  // Force the width and height and margins to never extend the containing element
  maxHeight: `calc(100vh - 2 * ${spacing['600']}px)`,
  maxWidth: `calc(100vw - 2 * ${spacing['800']}px)`,

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
  height: 'auto',
  width: '100%',
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
      className={cx(
        styles,
        {
          [fullScreenStyles]: fullScreen && props.open,
        },
        className
      )}
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
