import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { Body, Modal as LeafyGreenModal } from '../leafygreen';
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
      {...props}
    >
      <Body as="div">{children}</Body>
    </LeafyGreenModal>
  );
}

const Modal = withStackedComponentStyles(UnwrappedModal);
export { Modal };
