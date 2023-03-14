import React from 'react';
import { css, Link, spacing } from '@mongodb-js/compass-components';

const toastActionStyles = css({
  textTransform: 'uppercase',
  marginLeft: spacing[2],
});

// Note: This is not in compass-components as having actions in toasts
// is not recommended by LeafyGreen. We are showing actions in toasts
// for the time being until we have a dedicated component for background
// operation actions in Compass.
export function useToastAction({
  statusMessage,
  actionHandler,
  actionText,
}: {
  statusMessage: string;
  actionHandler: () => void;
  actionText: string;
}) {
  return (
    <>
      {statusMessage}
      <Link onClick={actionHandler} href="#" className={toastActionStyles}>
        {actionText}
      </Link>
    </>
  );
}
