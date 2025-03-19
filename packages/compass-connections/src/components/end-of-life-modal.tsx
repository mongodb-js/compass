import React from 'react';
import {
  css,
  Banner,
  Link,
  spacing,
  Body,
  BannerVariant,
  showConfirmation,
} from '@mongodb-js/compass-components';

const modalBodyStyles = css({
  marginTop: spacing[3],
  marginBottom: spacing[2],
});

export function showEndOfLifeWarningModal(serverVersion: string) {
  return showConfirmation({
    title: 'End-Of-Life MongoDB Detected',
    description: (
      <>
        <Banner variant={BannerVariant.Warning}>
          Your MongoDB Server is running version {serverVersion}, which is no
          longer supported.
        </Banner>
        <Body className={modalBodyStyles}>
          This might lead to unexpected behavior while using MongoDB Compass,
          like certain features not working as expected or being unavailable.
          Consider upgrading for the best experience.{' '}
        </Body>
        <Link
          href="https://www.mongodb.com/legal/support-policy/lifecycles"
          target="_blank"
          data-testid="end-of-life-warning-modal-learn-more-link"
        >
          Learn more
        </Link>
      </>
    ),
  });
}
