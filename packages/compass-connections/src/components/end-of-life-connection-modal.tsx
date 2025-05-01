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

export function showEndOfLifeMongoDBWarningModal(
  connectionInfo?: ConnectionInfo,
  version?: string
) {
  return showConfirmation({
    title: 'End-of-life MongoDB Detected',
    description: (
      <>
        <Banner variant={BannerVariant.Warning}>
          {connectionInfo
            ? `Server or service "${getConnectionTitle(connectionInfo)}"`
            : 'This server or service'}{' '}
          appears to be running a version of MongoDB that is no longer
          supported.
        </Banner>
        <Body className={modalBodyStyles}>
          Server version{version ? ` (${version})` : ''} is considered
          end-of-life, consider upgrading to get the latest features and
          performance improvements.{' '}
        </Body>
        <Link
          href="https://www.mongodb.com/docs/manual/release-notes/"
          target="_blank"
          data-testid="end-of-life-warning-modal-learn-more-link"
        >
          Learn more from the MongoDB release notes.
        </Link>
      </>
    ),
  });
}
