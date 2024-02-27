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
    title: 'Data Processing Agreement',
    description: (
      <>
        <p className={paragraphStyles}>
          When you use natural language to query your data, your text prompt,
          along with your collection schema, will be sent to Microsoft and
          OpenAI for processing. Your data will not be stored, shared with any
          other third parties, or used to train AI models.
        </p>
        <p>
          <strong>
            This feature is experimental and may give inaccurate responses. Your
            usage of it is subject to:
          </strong>
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
