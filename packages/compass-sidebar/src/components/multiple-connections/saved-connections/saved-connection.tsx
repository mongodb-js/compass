import {
  type ConnectionInfo,
  getConnectionTitle,
} from '@mongodb-js/connection-info';
import { useConnectionStatus } from '@mongodb-js/compass-connections/provider';
import React, { useCallback } from 'react';
import {
  css,
  spacing,
  Icon,
  IconButton,
  ItemActionControls,
  useHoverState,
  useToast,
  useDarkMode,
  palette,
} from '@mongodb-js/compass-components';
import { WithStatusMarker } from '../../with-status-marker';
import type { ItemAction } from '@mongodb-js/compass-components';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { useMaybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';
import type { ItemSeparator } from '@mongodb-js/compass-components/lib/components/item-action-controls';
const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

const iconStyles = css({
  flex: 'none',
  height: spacing[3],
});

const savedConnectionStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[2],
  borderRadius: spacing[1],
  padding: spacing[1],
  paddingLeft: spacing[2],
  alignItems: 'center',
  cursor: 'pointer',
  marginTop: 'auto',
});

const savedConnectionNameStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const savedConnectionToolbarStyles = css({
  marginLeft: 'auto',
  paddingLeft: spacing[5],
  display: 'flex',
  flexDirection: 'row',
});

type Action =
  | 'edit-connection'
  | 'toggle-favorite'
  | 'copy-connection-string'
  | 'duplicate-connection'
  | 'remove-connection';

const WarningIcon = () => {
  return (
    <Icon
      className={iconStyles}
      size={spacing[3]}
      color={palette.red.base}
      glyph="Warning"
    />
  );
};

const ServerIcon = () => {
  const darkMode = useDarkMode();
  const stroke = darkMode ? palette.white : palette.gray.dark2;

  return (
    <svg
      className={iconStyles}
      width={spacing[3]}
      height={spacing[3]}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_842_15453)">
        <path
          d="M11.6665 1.1665H2.33317C1.68884 1.1665 1.1665 1.68884 1.1665 2.33317V4.6665C1.1665 5.31084 1.68884 5.83317 2.33317 5.83317H11.6665C12.3108 5.83317 12.8332 5.31084 12.8332 4.6665V2.33317C12.8332 1.68884 12.3108 1.1665 11.6665 1.1665Z"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11.6665 8.1665H2.33317C1.68884 8.1665 1.1665 8.68884 1.1665 9.33317V11.6665C1.1665 12.3108 1.68884 12.8332 2.33317 12.8332H11.6665C12.3108 12.8332 12.8332 12.3108 12.8332 11.6665V9.33317C12.8332 8.68884 12.3108 8.1665 11.6665 8.1665Z"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 3.5H3.50667"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 10.5H3.50667"
          stroke={stroke}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_842_15453">
          <rect width="14" height="14" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

type SavedConnectionProps = {
  connectionInfo: ConnectionInfo;
  onConnect(connectionInfo: ConnectionInfo): void;
  onEditConnection(connectionInfo: ConnectionInfo): void;
  onDeleteConnection(connectionInfo: ConnectionInfo): void;
  onDuplicateConnection(connectionInfo: ConnectionInfo): void;
  onToggleFavoriteConnection(connectionInfo: ConnectionInfo): void;
};

export function SavedConnection({
  connectionInfo,
  onConnect,
  onEditConnection,
  onDeleteConnection,
  onDuplicateConnection,
  onToggleFavoriteConnection,
}: SavedConnectionProps): React.ReactElement {
  const { connectionColorToHex } = useConnectionColor();
  const { status: connectionStatus } = useConnectionStatus(connectionInfo.id);

  const isLocalhost =
    connectionInfo.connectionOptions.connectionString.startsWith(
      'mongodb://localhost'
    );

  const maybeProtectConnectionString = useMaybeProtectConnectionString();
  const [hoverProps, isHovered] = useHoverState();
  const isFavorite = connectionInfo.savedConnectionType === 'favorite';
  const { openToast } = useToast('compass-connections');

  let icon: React.ReactElement;
  if (connectionStatus === 'failed') {
    icon = <WarningIcon />;
  } else if (isLocalhost) {
    icon = (
      <WithStatusMarker status={connectionStatus}>
        <Icon size={spacing[3]} className={iconStyles} glyph="Laptop" />
      </WithStatusMarker>
    );
  } else if (isFavorite) {
    icon = (
      <WithStatusMarker status={connectionStatus}>
        <Icon size={spacing[3]} className={iconStyles} glyph="Favorite" />
      </WithStatusMarker>
    );
  } else {
    icon = (
      <WithStatusMarker status={connectionStatus}>
        <ServerIcon />
      </WithStatusMarker>
    );
  }

  async function copyConnectionString(connectionString: string) {
    try {
      await navigator.clipboard.writeText(connectionString);
      openToast('copy-to-clipboard', {
        title: 'Success',
        description: 'Copied to clipboard.',
        variant: 'success',
        timeout: TOAST_TIMEOUT_MS,
      });
    } catch (err) {
      openToast('copy-to-clipboard', {
        title: 'Error',
        description:
          'An error occurred when copying to clipboard. Please try again.',
        variant: 'warning',
        timeout: TOAST_TIMEOUT_MS,
      });
    }
  }

  const actions: (ItemAction<Action> | ItemSeparator)[] = [
    {
      action: 'edit-connection',
      label: 'Edit connection',
      icon: 'Edit',
    },
    {
      action: 'copy-connection-string',
      label: 'Copy connection string',
      icon: 'Copy',
    },
    {
      action: 'toggle-favorite',
      label:
        connectionInfo.savedConnectionType === 'favorite'
          ? 'Unfavorite'
          : 'Favorite',
      icon: 'Favorite',
    },
    {
      action: 'duplicate-connection',
      label: 'Duplicate',
      icon: 'Clone',
    },
    { separator: true },
    {
      action: 'remove-connection',
      label: 'Remove',
      icon: 'Trash',
      variant: 'destructive',
    },
  ];

  const onAction = useCallback(
    (action: Action) => {
      switch (action) {
        case 'edit-connection':
          return onEditConnection(connectionInfo);
        case 'copy-connection-string':
          return void copyConnectionString(
            maybeProtectConnectionString(
              connectionInfo.connectionOptions.connectionString
            )
          );
        case 'toggle-favorite':
          return onToggleFavoriteConnection(connectionInfo);
        case 'duplicate-connection':
          return onDuplicateConnection(connectionInfo);
        case 'remove-connection':
          return onDeleteConnection(connectionInfo);
      }
    },
    [
      connectionInfo,
      onEditConnection,
      copyConnectionString,
      maybeProtectConnectionString,
      onToggleFavoriteConnection,
      onDuplicateConnection,
      onDeleteConnection,
    ]
  );
  return (
    <li
      {...hoverProps}
      style={{
        backgroundColor: connectionColorToHex(connectionInfo.favorite?.color),
      }}
      className={savedConnectionStyles}
      data-testid={`saved-connection-${connectionInfo.id}`}
    >
      {icon}{' '}
      <div className={savedConnectionNameStyles}>
        {getConnectionTitle(connectionInfo)}
      </div>
      <div
        style={{ visibility: isHovered ? 'visible' : 'hidden' }}
        className={savedConnectionToolbarStyles}
      >
        <IconButton
          onClick={() => onConnect(connectionInfo)}
          data-testid="connect-button"
          aria-label="Connect"
          title="Connect"
        >
          <Icon glyph="Connect" />
        </IconButton>
        <ItemActionControls<Action>
          data-testid="connection-menu"
          onAction={onAction}
          iconSize="small"
          actions={actions}
          isVisible={isHovered}
        ></ItemActionControls>
      </div>
    </li>
  );
}
