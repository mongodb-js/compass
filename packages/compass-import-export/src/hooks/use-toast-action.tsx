import React from 'react';
import {
  Button,
  Body,
  css,
  spacing,
  Link,
} from '@mongodb-js/compass-components';

const importStatusStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
});

const toastActionStyles = css({
  textTransform: 'uppercase',
  // marginTop: spacing[2],
  // marginBottom: spacing[1],
  // Override LeafyGreen's toast button `position: absolute` styles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // position: 'relative !important' as any,
});

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
      <Link
        // as={Button}
        as="button"
        onClick={actionHandler}
        href="#"
        // h
        className={toastActionStyles}
      >
        {actionText}
      </Link>
    </>
  );
  //  <div className={importStatusStyles}>
  {
    /* <Body>
        {statusMessage}
      </Body> */
  }
  {
    /* <Button
        onClick={actionHandler}
        className={toastActionStyles}
      >
        {actionText}
      </Button> */
  }

  //   <Link
  //     as={Button}
  //     onClick={actionHandler}
  //     className={toastActionStyles}
  //   >
  //     {actionText}
  //   </Link>
  // </div>
  // )
}
