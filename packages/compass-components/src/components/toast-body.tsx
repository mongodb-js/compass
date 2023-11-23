import React from 'react';
import { Link } from './leafygreen';
import { css } from '@leafygreen-ui/emotion';

const toastBodyFlexStyles = css({
  display: 'flex',
  flexDirection: 'row',
});

const toastBodyTextStyles = css({
  flexGrow: 1,
});

const toastActionStyles = css({
  textTransform: 'uppercase',
  flexGrow: 0,
  alignSelf: 'center',

  // Remove button styles.
  border: 'none',
  padding: 0,
  margin: 0,
  background: 'none',
});

// TODO(COMPASS-6808): Once we update our `@leafygreen-ui/toast` we can use the
// provided action interface and remove this.
export function ToastBody({
  statusMessage,
  actionHandler,
  actionText,
}: {
  statusMessage: string;
  actionHandler?: () => void;
  actionText: string;
}) {
  return (
    <div className={toastBodyFlexStyles}>
      <p className={toastBodyTextStyles}>{statusMessage}</p>
      {!!actionHandler && (
        <Link
          as="button"
          data-testid={`toast-action-${actionText}`}
          onClick={actionHandler}
          hideExternalIcon
          className={toastActionStyles}
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
