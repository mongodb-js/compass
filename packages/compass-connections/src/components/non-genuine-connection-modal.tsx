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
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';

const modalBodyStyles = css({
  marginTop: spacing[400],
  marginBottom: spacing[200],
});

export function showNonGenuineMongoDBWarningModal(
  connectionInfo?: ConnectionInfo
) {
  return showConfirmation({
    title: 'Non-Genuine MongoDB Detected',
    hideCancelButton: true,
    description: (
      <>
        <Banner variant={BannerVariant.Warning}>
          {connectionInfo
            ? `Server or service "${getConnectionTitle(connectionInfo)}"`
            : 'This server or service'}{' '}
          appears to be an emulation of MongoDB rather than an official MongoDB
          product.
        </Banner>
        <Body className={modalBodyStyles}>
          Some documented MongoDB features may work differently, be entirely
          missing or incomplete, or have unexpected performance characteristics.{' '}
        </Body>
        <Link
          href="https://www.mongodb.com/docs/compass/master/faq/#why-am-i-seeing-a-warning-about-a-non-genuine-mongodb-server-"
          target="_blank"
          data-testid="non-genuine-warning-modal-learn-more-link"
        >
          Learn more
        </Link>
      </>
    ),
  });
}
