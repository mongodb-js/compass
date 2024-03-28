import {
  type ConnectionInfo,
  getConnectionTitle,
} from '@mongodb-js/connection-info';
import {
  type CanNotOpenConnectionReason,
  useConnectionStatus,
} from '@mongodb-js/compass-connections/provider';
import React, { useCallback } from 'react';
import {
  css,
  spacing,
  Icon,
  IconButton,
  ItemActionControls,
  useHoverState,
  useToast,
  palette,
  Tooltip,
} from '@mongodb-js/compass-components';
import { WithStatusMarker } from '../../with-status-marker';
import type { ItemAction } from '@mongodb-js/compass-components';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { useMaybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';
import type { ItemSeparator } from '@mongodb-js/compass-components/lib/components/item-action-controls';
import { ServerIcon } from '@mongodb-js/compass-components';
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

type SavedConnectionProps = {
  canOpenNewConnection: boolean;
  canNotOpenReason?: CanNotOpenConnectionReason;
  maximumNumberOfConnectionsOpen: number;
  connectionInfo: ConnectionInfo;
  onConnect(connectionInfo: ConnectionInfo): void;
  onEditConnection(connectionInfo: ConnectionInfo): void;
  onDeleteConnection(connectionInfo: ConnectionInfo): void;
  onDuplicateConnection(connectionInfo: ConnectionInfo): void;
  onToggleFavoriteConnection(connectionInfo: ConnectionInfo): void;
};

export function SavedConnection({
  canOpenNewConnection,
  canNotOpenReason,
  maximumNumberOfConnectionsOpen,
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
        <Tooltip
          align="top"
          justify="middle"
          enabled={!canOpenNewConnection}
          trigger={({ children, ...props }) => (
            <IconButton
              {...props}
              disabled={!canOpenNewConnection}
              onClick={() => onConnect(connectionInfo)}
              data-testid="connect-button"
              aria-label="Connect"
              title="Connect"
            >
              <Icon glyph="Connect" />
              {children}
            </IconButton>
          )}
        >
          {canNotOpenReason === 'maximum-number-exceeded' &&
            `Only ${maximumNumberOfConnectionsOpen} connection${
              maximumNumberOfConnectionsOpen > 1 ? 's' : ''
            } can be open at the same time. First disconnect from another cluster.`}
        </Tooltip>
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
