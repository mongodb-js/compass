import React, { useCallback } from 'react';
import {
  Body,
  Code,
  css,
  Link,
  showConfirmation,
  spacing,
  useToast,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { getConnectionTitle } from '@mongodb-js/connection-info';
import { usePreference } from 'compass-preferences-model/provider';
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
  onReview: () => void;
};

const connectionErrorToastBodyStyles = css({
  display: 'flex',
  alignItems: 'start',
  gap: spacing[2],
});

const connectionErrorToastActionMessageStyles = css({
  marginTop: spacing[1],
  flexGrow: 0,
});

function ConnectionErrorToastBody({
  info,
  onReview,
}: ConnectionErrorToastBodyProps): React.ReactElement {
  return (
    <span className={connectionErrorToastBodyStyles}>
      <span data-testid="connection-error-text">
        There was a problem connecting{' '}
        {info ? `to ${getConnectionTitle(info)}` : ''}
      </span>
      {info && (
        <Link
          className={connectionErrorToastActionMessageStyles}
          hideExternalIcon={true}
          onClick={onReview}
          data-testid="connection-error-review"
        >
          REVIEW
        </Link>
      )}
    </span>
  );
}

const noop = () => undefined;

const deviceAuthModalContentStyles = css({
  textAlign: 'center',
  '& > *:not(:last-child)': {
    paddingBottom: spacing[150],
  },
});

/**
 * Returns triggers for various notifications (toasts and modals) that are
 * supposed to be displayed every time connection flow is happening in the
 * application.
 *
 * All toasts and modals are only applicable in multiple connections mode. Right
 * now it's gated by the feature flag, the flag check can be removed when this
 * is the default behavior
 */
export function useConnectionStatusNotifications() {
  const enableNewMultipleConnectionSystem = usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const { openToast, closeToast } = useToast('connection-status');

  const openConnectionStartedToast = useCallback(
    (connectionInfo: ConnectionInfo, onCancelClick: () => void) => {
      const { title, description } = getConnectingStatusText(connectionInfo);
      openToast(connectionInfo.id, {
        title,
        description,
        dismissible: true,
        variant: 'progress',
        actionElement: (
          <Link
            hideExternalIcon={true}
            onClick={() => {
              closeToast(connectionInfo.id);
              onCancelClick();
            }}
            data-testid="cancel-connection-button"
          >
            CANCEL
          </Link>
        ),
      });
    },
    [closeToast, openToast]
  );

  const openConnectionSucceededToast = useCallback(
    (connectionInfo: ConnectionInfo) => {
      openToast(connectionInfo.id, {
        title: `Connected to ${getConnectionTitle(connectionInfo)}`,
        variant: 'success',
        timeout: 3_000,
      });
    },
    [openToast]
  );

  const openConnectionFailedToast = useCallback(
    (
      // Connection info might be missing if we failed connecting before we
      // could even resolve connection info. Currently the only case where this
      // can happen is autoconnect flow
      connectionInfo: ConnectionInfo | null | undefined,
      error: Error,
      onReviewClick: () => void
    ) => {
      const failedToastId = connectionInfo?.id ?? 'failed';

      openToast(failedToastId, {
        title: error.message,
        description: (
          <ConnectionErrorToastBody
            info={connectionInfo}
            onReview={() => {
              closeToast(failedToastId);
              onReviewClick();
            }}
          />
        ),
        variant: 'warning',
      });
    },
    [closeToast, openToast]
  );

  const openMaximumConnectionsReachedToast = useCallback(
    (maxConcurrentConnections: number) => {
      const message = `Only ${maxConcurrentConnections} connection${
        maxConcurrentConnections > 1 ? 's' : ''
      } can be connected to at the same time. First disconnect from another connection.`;

      openToast('max-connections-reached', {
        title: 'Maximum concurrent connections limit reached',
        description: message,
        variant: 'warning',
        timeout: 5_000,
      });
    },
    [openToast]
  );

  const openNotifyDeviceAuthModal = useCallback(
    (
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
    },
    []
  );

  // Gated by the feature flag: if flag is on, we return trigger functions, if
  // flag is off, we return noop functions so that we can call them
  // unconditionally in the actual flow
  return enableNewMultipleConnectionSystem
    ? {
        openNotifyDeviceAuthModal,
        openConnectionStartedToast,
        openConnectionSucceededToast,
        openConnectionFailedToast,
        openMaximumConnectionsReachedToast,
        closeConnectionStatusToast: closeToast,
      }
    : {
        openNotifyDeviceAuthModal: noop,
        openConnectionStartedToast: noop,
        openConnectionSucceededToast: noop,
        openConnectionFailedToast: noop,
        openMaximumConnectionsReachedToast: noop,
        closeConnectionStatusToast: noop,
      };
}
