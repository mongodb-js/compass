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
import { isCancelError } from '@mongodb-js/compass-utils';

export function isOIDCAuth(connectionString: string): boolean {
  const authMechanismString = (
    new ConnectionString(connectionString).searchParams.get('authMechanism') ||
    ''
  ).toUpperCase();

  return authMechanismString === 'MONGODB-OIDC';
}

export function getConnectionErrorMessage(err?: any) {
  return isCancelError(err) ? null : err?.message ?? null;
}

export function getConnectingStatusText(connectionInfo: ConnectionInfo) {
  const connectionTitle = getConnectionTitle(connectionInfo);
  const isOIDC = isOIDCAuth(connectionInfo.connectionOptions.connectionString);
  return {
    title: `Connecting to ${connectionTitle}`,
    description: isOIDC ? 'Go to the browser to complete authentication' : '',
  };
}

type ConnectionErrorToastBodyProps = {
  info?: ConnectionInfo | null;
  error: Error;
  showReviewButton: boolean;
  showDebugButton: boolean;
  onReview: () => void;
  onDebug: () => void;
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
});

const connectionErrorTitleStyles = css({
  fontWeight: 'bold',
});

const debugActionStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  justifyContent: 'right',
  textWrap: 'nowrap',
});

function ConnectionErrorToastBody({
  info,
  error,
  showReviewButton,
  showDebugButton,
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
          {info ? getConnectionTitle(info) : 'Connection failed'}
        </span>
        <span data-testid="connection-error-text">{error.message}</span>
      </span>
      <span className={connectionErrorActionsStyles}>
        {info && showReviewButton && (
          <span>
            <Button
              onClick={onReview}
              data-testid="connection-error-review"
              size="small"
            >
              Review
            </Button>
          </span>
        )}
        {info && showDebugButton && (
          <span className={debugActionStyles}>
            <Icon glyph="Sparkle" size="small"></Icon>
            <Link
              hideExternalIcon={true}
              onClick={onDebug}
              data-testid="connection-error-debug"
            >
              Debug for me
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
        CANCEL
      </Link>
    ),
  });
};

const openConnectionSucceededToast = (connectionInfo: ConnectionInfo) => {
  openToast(`connection-status--${connectionInfo.id}`, {
    title: `Connected to ${getConnectionTitle(connectionInfo)}`,
    variant: 'success',
    timeout: 3_000,
  });
};

const openConnectionFailedToast = ({
  connectionInfo,
  error,
  showReviewButton,
  showDebugButton,
  onReviewClick,
  onDebugClick,
}: {
  // Connection info might be missing if we failed connecting before we
  // could even resolve connection info. Currently the only case where this
  // can happen is autoconnect flow
  connectionInfo: ConnectionInfo | null | undefined;
  error: Error;
  showReviewButton: boolean;
  showDebugButton: boolean;
  onReviewClick: () => void;
  onDebugClick: () => void;
}) => {
  const failedToastId = connectionInfo?.id ?? 'failed';

  openToast(`connection-status--${failedToastId}`, {
    // we place the title inside the description to get the layout we need
    title: '',
    description: (
      <ConnectionErrorToastBody
        info={connectionInfo}
        error={error}
        showReviewButton={showReviewButton}
        showDebugButton={showDebugButton}
        onReview={() => {
          if (!showDebugButton) {
            // don't close the toast if there are two actions so that the user
            // can still use the other one
            closeToast(`connection-status--${failedToastId}`);
          }
          onReviewClick();
        }}
        onDebug={() => {
          onDebugClick();
        }}
      />
    ),
    variant: 'warning',
    className: connectionErrorToastStyles,
  });
};

const openMaximumConnectionsReachedToast = (
  maxConcurrentConnections: number
) => {
  const message = `Only ${maxConcurrentConnections} connection${
    maxConcurrentConnections > 1 ? 's' : ''
  } can be connected to at the same time. First disconnect from another connection.`;

  openToast('max-connections-reached', {
    title: 'Maximum concurrent connections limit reached',
    description: message,
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
    title: `Complete authentication in the browser`,
    description: (
      <div className={deviceAuthModalContentStyles}>
        <Body>
          Visit the following URL to complete authentication for{' '}
          <b>{getConnectionTitle(connectionInfo)}</b>:
        </Body>
        <Body>
          <Link href={verificationUrl} target="_blank">
            {verificationUrl}
          </Link>
        </Body>
        <br></br>
        <Body>Enter the following code on that page:</Body>
        <Body as="div">
          <Code language="none" copyable>
            {userCode}
          </Code>
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
