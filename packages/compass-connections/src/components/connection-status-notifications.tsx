import React from 'react';
import {
  Body,
  Code,
  css,
  Link,
  showConfirmation,
  spacing,
  openToast,
  closeToast,
  Icon,
  Button,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';
import { i18n } from '../i18n';

export function isOIDCAuth(connectionString: string): boolean {
  const authMechanismString = (
    new ConnectionString(connectionString).searchParams.get('authMechanism') ||
    ''
  ).toUpperCase();

  return authMechanismString === 'MONGODB-OIDC';
}

export function getConnectingStatusText(connectionInfo: ConnectionInfo) {
  const connectionTitle = getConnectionTitle(connectionInfo);
  const isOIDC = isOIDCAuth(connectionInfo.connectionOptions.connectionString);
  return {
    title: i18n.t('connectingToTitle', { connectionTitle }),
    description: isOIDC ? i18n.t('completeAuthInBrowser') : '',
  };
}

type ConnectionErrorToastBodyProps = {
  info?: ConnectionInfo | null;
  error: Error;
  onReview?: () => void;
  onDebug?: () => void;
};

const connectionErrorToastStyles = css({
  // the gap on the right after the buttons takes up a lot of space from the
  // description, so we remove it and add a little bit of margin elsewhere
  gap: 0,
  '[data-testid="lg-toast-content"] > div, [data-testid="lg-toast-content"] > div > p + p':
    {
      // don't cut off the glow of the button
      overflow: 'visible',
    },
});

const connectionErrorToastBodyStyles = css({
  display: 'grid',
  gridAutoFlow: 'column',
  gap: spacing[200],
});

const connectionErrorActionsStyles = css({
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'right',
  // replacing the gap with a margin so the button glow does not get cut off
  marginRight: spacing[100],
  gap: spacing[100],
  justifyContent: 'center',
});

const connectionErrorStyles = css({
  display: 'flex',
  flexDirection: 'column',
  wordBreak: 'break-word',
});

const connectionErrorTitleStyles = css({
  fontWeight: 'bold',
});

const debugActionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  justifyContent: 'left',
  textWrap: 'nowrap',
});

function ConnectionErrorToastBody({
  info,
  error,
  onReview,
  onDebug,
}: ConnectionErrorToastBodyProps): React.ReactElement {
  return (
    <span className={connectionErrorToastBodyStyles}>
      <span className={connectionErrorStyles}>
        <span
          data-testid="connection-error-title"
          className={connectionErrorTitleStyles}
        >
          {info ? getConnectionTitle(info) : i18n.t('connectionFailed')}
        </span>
        <span data-testid="connection-error-text">{error.message}</span>
      </span>
      <span className={connectionErrorActionsStyles}>
        {info && onReview && (
          <span>
            <Button
              onClick={onReview}
              data-testid="connection-error-review"
              size="small"
            >
              {i18n.t('review')}
            </Button>
          </span>
        )}
        {info && onDebug && (
          <span className={debugActionStyles}>
            <Icon glyph="Sparkle" size="small"></Icon>
            <Link
              hideExternalIcon={true}
              onClick={onDebug}
              data-testid="connection-error-debug"
            >
              {i18n.t('debug')}
            </Link>
          </span>
        )}
      </span>
    </span>
  );
}

const deviceAuthModalContentStyles = css({
  textAlign: 'center',
  '& > *:not(:last-child)': {
    paddingBottom: spacing[150],
  },
});

const openConnectionStartedToast = (
  connectionInfo: ConnectionInfo,
  onCancelClick: () => void
) => {
  const { title, description } = getConnectingStatusText(connectionInfo);
  openToast(`connection-status--${connectionInfo.id}`, {
    title,
    description,
    dismissible: true,
    variant: 'progress',
    actionElement: (
      <Link
        hideExternalIcon={true}
        onClick={() => {
          closeToast(`connection-status--${connectionInfo.id}`);
          onCancelClick();
        }}
        data-testid="cancel-connection-button"
      >
        {i18n.t('cancel')}
      </Link>
    ),
  });
};

const openConnectionSucceededToast = (connectionInfo: ConnectionInfo) => {
  openToast(`connection-status--${connectionInfo.id}`, {
    title: i18n.t('connectedToTitle', {
      connectionTitle: getConnectionTitle(connectionInfo),
    }),
    variant: 'success',
    timeout: 3_000,
  });
};

const openConnectionFailedToast = ({
  connectionInfo,
  error,
  onReviewClick,
  onDebugClick,
}: {
  // Connection info might be missing if we failed connecting before we
  // could even resolve connection info. Currently the only case where this
  // can happen is autoconnect flow
  connectionInfo: ConnectionInfo | null | undefined;
  error: Error;
  onReviewClick?: () => void;
  onDebugClick?: () => void;
}) => {
  const failedToastId = connectionInfo?.id ?? 'failed';

  openToast(`connection-status--${failedToastId}`, {
    // we place the title inside the description to get the layout we need
    title: '',
    description: (
      <ConnectionErrorToastBody
        info={connectionInfo}
        error={error}
        onReview={
          onReviewClick
            ? () => {
                closeToast(`connection-status--${failedToastId}`);
                onReviewClick();
              }
            : undefined
        }
        onDebug={
          onDebugClick
            ? () => {
                closeToast(`connection-status--${failedToastId}`);
                onDebugClick();
              }
            : undefined
        }
      />
    ),
    variant: 'warning',
    className: connectionErrorToastStyles,
  });
};

const openMaximumConnectionsReachedToast = (
  maxConcurrentConnections: number
) => {
  openToast('max-connections-reached', {
    title: i18n.t('maxConnectionsTitle'),
    description: i18n.t('maxConnectionsMessage', {
      count: maxConcurrentConnections,
    }),
    variant: 'warning',
    timeout: 5_000,
  });
};

const openNotifyDeviceAuthModal = (
  connectionInfo: ConnectionInfo,
  verificationUrl: string,
  userCode: string,
  onCancel: () => void,
  signal: AbortSignal
) => {
  void showConfirmation({
    title: i18n.t('deviceAuthTitle'),
    description: (
      <div className={deviceAuthModalContentStyles}>
        <Body>
          {i18n.t('deviceAuthVisitUrl', {
            connectionTitle: getConnectionTitle(connectionInfo),
          })}
        </Body>
        <Body>
          <Link href={verificationUrl} target="_blank">
            {verificationUrl}
          </Link>
        </Body>
        <br></br>
        <Body>{i18n.t('deviceAuthEnterCode')}</Body>
        <Body as="div">
          <Code language="none">{userCode}</Code>
        </Body>
      </div>
    ),
    hideConfirmButton: true,
    signal,
  }).then(
    (result) => {
      if (result === false) {
        onCancel?.();
      }
    },
    () => {
      // Abort signal was triggered
    }
  );
};

export function getNotificationTriggers() {
  return {
    openNotifyDeviceAuthModal,
    openConnectionStartedToast,
    openConnectionSucceededToast,
    openConnectionFailedToast,
    openMaximumConnectionsReachedToast,
    closeConnectionStatusToast: (connectionId: string) => {
      return closeToast(`connection-status--${connectionId}`);
    },
  };
}

/**
 * Returns triggers for various notifications (toasts and modals) that are
 * supposed to be displayed every time connection flow is happening in the
 * application.
 */
export function useConnectionStatusNotifications() {
  return getNotificationTriggers();
}
