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
  Button,
  palette,
  AssistantSparkleIcon,
  translate,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import ConnectionString from 'mongodb-connection-string-url';

export function isOIDCAuth(connectionString: string): boolean {
  const authMechanismString = (
    new ConnectionString(connectionString).searchParams.get('authMechanism') ||
    ''
  ).toUpperCase();

  return authMechanismString === 'MONGODB-OIDC';
}

export function getConnectingStatusText(
  connectionInfo: ConnectionInfo,
  language = 'en'
) {
  const connectionTitle = getConnectionTitle(connectionInfo);
  const isOIDC = isOIDCAuth(connectionInfo.connectionOptions.connectionString);
  return {
    title: translate(
      language,
      'connections.notifications.connecting',
      'Connecting to {title}',
      { title: connectionTitle }
    ),
    description: isOIDC
      ? translate(
          language,
          'connections.notifications.completeAuthInBrowser',
          'Go to the browser to complete authentication'
        )
      : '',
  };
}

type ConnectionErrorToastBodyProps = {
  info?: ConnectionInfo | null;
  error: Error;
  language: string;
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
  gap: spacing[200],
});

const connectionErrorActionsStyles = css({
  display: 'flex',
  // replacing the gap with a margin so the button glow does not get cut off
  marginRight: spacing[100],
  gap: spacing[100],
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
  textWrap: 'nowrap',
  // Neutralize the Button's own border so only the gradient ring shows.
  position: 'relative',
  border: 'none',
  backgroundColor: 'transparent',
  // Draw the gradient as an overlay ring on top of the button, then punch out
  // the interior with a mask so only the border-width band remains
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: spacing[150],
    padding: 1,
    background: `linear-gradient(to right, ${palette.green.base}, ${palette.blue.base})`,
    mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    maskComposite: 'exclude',
    WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
    WebkitMaskComposite: 'xor',
  },
});

function ConnectionErrorToastBody({
  info,
  error,
  language,
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
          {info
            ? getConnectionTitle(info)
            : translate(
                language,
                'connections.notifications.connectionFailed',
                'Connection failed'
              )}
        </span>
        <span data-testid="connection-error-text">{error.message}</span>
      </span>
      <span className={connectionErrorActionsStyles}>
        {info && onDebug && (
          <Button
            className={debugActionStyles}
            size="small"
            onClick={onDebug}
            data-testid="connection-error-debug"
            leftGlyph={<AssistantSparkleIcon />}
          >
            {translate(language, 'connections.notifications.debug', 'Debug')}
          </Button>
        )}
        {info && onReview && (
          <Button
            onClick={onReview}
            data-testid="connection-error-review"
            size="small"
          >
            {translate(language, 'connections.notifications.review', 'Review')}
          </Button>
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
  onCancelClick: () => void,
  language: string
) => {
  const { title, description } = getConnectingStatusText(
    connectionInfo,
    language
  );
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
        {translate(language, 'connections.notifications.cancel', 'CANCEL')}
      </Link>
    ),
  });
};

const openConnectionSucceededToast = (
  connectionInfo: ConnectionInfo,
  language: string
) => {
  openToast(`connection-status--${connectionInfo.id}`, {
    title: translate(
      language,
      'connections.notifications.connected',
      'Connected to {title}',
      { title: getConnectionTitle(connectionInfo) }
    ),
    variant: 'success',
    timeout: 3_000,
  });
};

const openConnectionFailedToast = ({
  connectionInfo,
  error,
  onReviewClick,
  onDebugClick,
  language,
}: {
  // Connection info might be missing if we failed connecting before we
  // could even resolve connection info. Currently the only case where this
  // can happen is autoconnect flow
  connectionInfo: ConnectionInfo | null | undefined;
  error: Error;
  onReviewClick?: () => void;
  onDebugClick?: () => void;
  language: string;
}) => {
  const failedToastId = connectionInfo?.id ?? 'failed';

  openToast(`connection-status--${failedToastId}`, {
    // we place the title inside the description to get the layout we need
    title: '',
    description: (
      <ConnectionErrorToastBody
        info={connectionInfo}
        error={error}
        language={language}
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
  maxConcurrentConnections: number,
  language: string
) => {
  const message =
    maxConcurrentConnections > 1
      ? translate(
          language,
          'connections.notifications.maxConnections.other',
          'Only {count} connections can be connected to at the same time. First disconnect from another connection.',
          { count: maxConcurrentConnections }
        )
      : translate(
          language,
          'connections.notifications.maxConnections.one',
          'Only {count} connection can be connected to at the same time. First disconnect from another connection.',
          { count: maxConcurrentConnections }
        );

  openToast('max-connections-reached', {
    title: translate(
      language,
      'connections.notifications.maxConnectionsTitle',
      'Maximum concurrent connections limit reached'
    ),
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
  signal: AbortSignal,
  language: string
) => {
  void showConfirmation({
    title: translate(
      language,
      'connections.notifications.deviceAuthTitle',
      'Complete authentication in the browser'
    ),
    description: (
      <div className={deviceAuthModalContentStyles}>
        <Body>
          {translate(
            language,
            'connections.notifications.deviceAuthVisit',
            'Visit the following URL to complete authentication for'
          )}{' '}
          <b>{getConnectionTitle(connectionInfo)}</b>:
        </Body>
        <Body>
          <Link href={verificationUrl} target="_blank">
            {verificationUrl}
          </Link>
        </Body>
        <br></br>
        <Body>
          {translate(
            language,
            'connections.notifications.deviceAuthEnterCode',
            'Enter the following code on that page:'
          )}
        </Body>
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

export function getNotificationTriggers(language = 'en') {
  return {
    openNotifyDeviceAuthModal: (
      connectionInfo: ConnectionInfo,
      verificationUrl: string,
      userCode: string,
      onCancel: () => void,
      signal: AbortSignal
    ) =>
      openNotifyDeviceAuthModal(
        connectionInfo,
        verificationUrl,
        userCode,
        onCancel,
        signal,
        language
      ),
    openConnectionStartedToast: (
      connectionInfo: ConnectionInfo,
      onCancelClick: () => void
    ) => openConnectionStartedToast(connectionInfo, onCancelClick, language),
    openConnectionSucceededToast: (connectionInfo: ConnectionInfo) =>
      openConnectionSucceededToast(connectionInfo, language),
    openConnectionFailedToast: (
      options: Omit<Parameters<typeof openConnectionFailedToast>[0], 'language'>
    ) => openConnectionFailedToast({ ...options, language }),
    openMaximumConnectionsReachedToast: (maxConcurrentConnections: number) =>
      openMaximumConnectionsReachedToast(maxConcurrentConnections, language),
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
