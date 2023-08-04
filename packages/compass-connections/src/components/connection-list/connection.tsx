import React, { useCallback } from 'react';
import {
  H3,
  Description,
  spacing,
  palette,
  css,
  cx,
  useDarkMode,
  ItemActionControls,
  useHoverState,
  useToast,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';
import type { ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { getConnectionTitle } from '@mongodb-js/connection-storage/renderer';

import ConnectionIcon from './connection-icon';
import { useConnectionColor } from '@mongodb-js/connection-form';
import { maybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

type Action =
  | 'copy-connection-string'
  | 'duplicate-connection'
  | 'remove-connection';

const itemActionControls = css({
  position: 'absolute',
  right: spacing[1],
  top: spacing[2] + spacing[1],
  margin: 'auto 0',
  bottom: 0,
});

const connectionButtonContainerStyles = css({
  position: 'relative',
  width: '100%',
  '&:hover': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
    },
  },
  '&:focus': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
    },
  },
  '&:focus-within': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
    },
  },
});

const connectionButtonStyles = css({
  margin: 0,
  paddingTop: spacing[1],
  paddingRight: spacing[3],
  paddingBottom: spacing[1],
  paddingLeft: spacing[2],
  width: '100%',
  display: 'grid',
  gridTemplateAreas: `'color icon title' 'color . description'`,
  gridTemplateColumns: 'auto auto 1fr',
  gridTemplateRows: '1fr 1fr',
  alignItems: 'center',
  justifyItems: 'start',
  border: 'none',
  borderRadius: 0,
  background: 'none',
  '&:hover': {
    cursor: 'pointer',
    border: 'none',
  },
  '&:focus': {
    border: 'none',
  },
});

const connectionButtonStylesLight = css({
  '&:hover': {
    background: palette.gray.light2,
  },
});

const connectionButtonStylesDark = css({
  '&:hover': {
    background: palette.gray.dark2,
  },
});

const connectionTitleStyles = css({
  fontSize: '14px',
  fontWeight: 'normal',
  lineHeight: '20px',
  margin: 0,
  flexGrow: 1,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  gridArea: 'title',
  width: 'calc(100% - 20px)',
  textAlign: 'left',
});

const connectionDescriptionStyles = css({
  fontSize: '12px',
  lineHeight: '20px',
  margin: 0,
  padding: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  gridArea: 'description',
});

// Creates a date string formatted as `Oct 27, 3000, 2:06 PM`.
const dateConfig: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

const colorIndicatorStyles = css({
  height: 'calc(100% - 4px)',
  width: spacing[2],
  borderRadius: spacing[2],
  margin: '2px 0',
  marginRight: spacing[2],
  gridArea: 'color',
});

function FavoriteColorIndicator({
  favorite,
  className,
}: {
  favorite?: ConnectionInfo['favorite'];
  className?: string;
}): React.ReactElement {
  const { connectionColorToHex } = useConnectionColor();
  const favoriteColorHex = connectionColorToHex(favorite?.color);

  return (
    <div
      className={cx(colorIndicatorStyles, className)}
      style={{ backgroundColor: favoriteColorHex }}
    ></div>
  );
}

const actions: ItemAction<Action>[] = [
  {
    action: 'copy-connection-string',
    label: 'Copy connection string',
    icon: 'Copy',
  },

  {
    action: 'duplicate-connection',
    label: 'Duplicate',
    icon: 'Clone',
  },

  {
    action: 'remove-connection',
    label: 'Remove',
    icon: 'Trash',
  },
];

function Connection({
  isActive,
  connectionInfo,
  onClick,
  onDoubleClick,
  duplicateConnection,
  removeConnection,
}: {
  isActive: boolean;
  connectionInfo: ConnectionInfo;
  onClick: () => void;
  onDoubleClick: (connectionInfo: ConnectionInfo) => void;
  duplicateConnection: (connectionInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
}): React.ReactElement {
  const connectionTitle = getConnectionTitle(connectionInfo);
  const {
    connectionOptions: { connectionString },
    favorite,
    lastUsed,
  } = connectionInfo;

  const darkMode = useDarkMode();

  const { connectionColorToHex } = useConnectionColor();
  const favoriteColorHex = connectionColorToHex(favorite?.color) ?? '';

  const hasColoredBackground = isActive && favoriteColorHex;
  const normalTitleColor = darkMode ? palette.white : palette.gray.dark3;
  const titleColor = hasColoredBackground ? palette.black : normalTitleColor;
  const backgroundColor = hasColoredBackground ? favoriteColorHex : 'none';

  const normalDescriptionColor = darkMode
    ? palette.gray.light1
    : palette.gray.base;
  const descriptionColor = hasColoredBackground
    ? palette.gray.dark3
    : normalDescriptionColor;

  const normalConnectionMenuColor = darkMode
    ? palette.white
    : palette.gray.base;
  const connectionMenuColor = hasColoredBackground
    ? palette.gray.dark3
    : normalConnectionMenuColor;

  const { openToast } = useToast('compass-connections');

  const onAction = useCallback(
    (action: Action) => {
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

      if (action === 'copy-connection-string') {
        void copyConnectionString(
          maybeProtectConnectionString(
            connectionInfo.connectionOptions.connectionString
          )
        );
        return;
      }

      if (action === 'duplicate-connection') {
        duplicateConnection(connectionInfo);
        return;
      }

      if (action === 'remove-connection') {
        removeConnection(connectionInfo);
        return;
      }
    },
    [connectionInfo, duplicateConnection, openToast, removeConnection]
  );

  const [hoverProps, isHovered] = useHoverState();

  return (
    <div className={connectionButtonContainerStyles} {...hoverProps}>
      <button
        type="button"
        className={cx(
          connectionButtonStyles,
          darkMode ? connectionButtonStylesDark : connectionButtonStylesLight
        )}
        style={{
          background: backgroundColor,
        }}
        data-testid={`saved-connection-button-${connectionInfo.id || ''}`}
        onClick={onClick}
        onDoubleClick={() => onDoubleClick(connectionInfo)}
      >
        <FavoriteColorIndicator favorite={connectionInfo.favorite} />
        <ConnectionIcon
          color={titleColor}
          connectionString={connectionString}
        />
        <H3
          className={connectionTitleStyles}
          style={{ color: titleColor }}
          data-testid={`${favorite ? 'favorite' : 'recent'}-connection-title`}
          title={connectionTitle}
        >
          {connectionTitle}
        </H3>
        <Description
          className={connectionDescriptionStyles}
          style={{ color: descriptionColor }}
          data-testid={`${
            favorite ? 'favorite' : 'recent'
          }-connection-description`}
        >
          {lastUsed ? lastUsed.toLocaleString('default', dateConfig) : 'Never'}
        </Description>
      </button>
      <div className={itemActionControls}>
        <ItemActionControls<Action>
          data-testid="connection-menu"
          onAction={onAction}
          iconSize="small"
          actions={actions}
          isVisible={isHovered}
          iconStyle={{ color: connectionMenuColor }}
        ></ItemActionControls>
      </div>
    </div>
  );
}

export default Connection;
