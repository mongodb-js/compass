import React from 'react';
import {
  Link,
  css,
  showConfirmation,
  spacing,
  cx,
} from '@mongodb-js/compass-components';

const paragraphStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[3],
});

const listStyles = css({
  listStyle: 'disc',
  paddingLeft: spacing[4],
});

export function showOptInConfirmation() {
  return showConfirmation({
    title: 'Artificial Intelligence Terms and Conditions',
    description: (
      <>
        <p className={paragraphStyles}>
          Query and aggregation generation uses generative artificial
          intelligence. It is experimental and may give inaccurate responses.
          Your usage of this feature is subject to:
        </p>
        <ul className={cx(paragraphStyles, listStyles)}>
          <li>Your applicable MongoDB legal agreement</li>
          <li>
            Our{' '}
            <Link href="https://www.mongodb.com/legal/acceptable-use-policy">
              Acceptable Use Policy
            </Link>
          </li>
          <li>
            Our{' '}
            <Link href="https://www.mongodb.com/legal/privacy-policy">
              Privacy Policy
            </Link>
          </li>
        </ul>
      </>
    ),
    buttonText: 'Agree and continue',
  });
}
