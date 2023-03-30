import React from 'react';
import { css, Link, spacing } from '@mongodb-js/compass-components';

const toastActionStyles = css({
  textTransform: 'uppercase',

  // Show the link action always to the right of the text.
  // We float it so that it does not constantly reposition when
  // contents, like a count, changes often.
  float: 'right',

  // Override LeafyGreen toast button positioning styles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  position: 'relative !important' as any,

  // Remove button styles.
  border: 'none',
  padding: 0,
  margin: 0,
  background: 'none',

  marginLeft: spacing[2],
});

// Note: This is not in compass-components as having actions in toasts
// is not recommended by LeafyGreen. We are showing actions in toasts
// for the time being until we have a dedicated component for background
// operation actions in Compass.
export function ImportToastBody({
  statusMessage,
  actionHandler,
  actionText,
}: {
  statusMessage: string;
  actionHandler?: () => void;
  actionText: string;
}) {
  return (
    <>
      <span>{statusMessage}</span>
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
    </>
  );
}
