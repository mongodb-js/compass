import React from 'react';
import {
  css,
  Banner,
  Link,
  spacing,
  Body,
  BannerVariant,
  showConfirmation,
  translate,
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
  version?: string,
  closeSignal?: AbortSignal,
  language = 'en'
) {
  return showConfirmation({
    title: translate(
      language,
      'connections.endOfLife.title',
      'End-of-life MongoDB Detected'
    ),
    hideCancelButton: true,
    description: (
      <>
        <Banner variant={BannerVariant.Warning}>
          {connectionInfo
            ? translate(
                language,
                'connections.endOfLife.namedWarning',
                'Server or service "{title}" appears to be running a version of MongoDB that is no longer supported.',
                { title: getConnectionTitle(connectionInfo) }
              )
            : translate(
                language,
                'connections.endOfLife.genericWarning',
                'This server or service appears to be running a version of MongoDB that is no longer supported.'
              )}
        </Banner>
        <Body className={modalBodyStyles}>
          {version
            ? translate(
                language,
                'connections.endOfLife.versionedBody',
                'Server version ({version}) is considered end-of-life, consider upgrading to get the latest features and performance improvements.',
                { version }
              )
            : translate(
                language,
                'connections.endOfLife.body',
                'Server version is considered end-of-life, consider upgrading to get the latest features and performance improvements.'
              )}{' '}
        </Body>
        <Link
          href="https://www.mongodb.com/legal/support-policy/lifecycles"
          target="_blank"
          data-testid="end-of-life-warning-modal-learn-more-link"
        >
          {translate(
            language,
            'connections.endOfLife.learnMore',
            'Learn more from the MongoDB Lifecycle Schedules.'
          )}
        </Link>
      </>
    ),
    signal: closeSignal,
  });
}
