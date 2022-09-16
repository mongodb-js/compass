import React, { useCallback, useMemo } from 'react';
import {
  H3,
  Description,
  compassFontSizes,
  spacing,
  uiColors,
  css,
  cx,
  useTheme,
  Theme,
  ItemActionControls,
  useHoverState,
  useToast,
  ToastVariant,
} from '@mongodb-js/compass-components';

import type { ItemAction } from '@mongodb-js/compass-components';
import type { ConnectionInfo } from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';

import ConnectionIcon from './connection-icon';
import { useConnectionColor } from '@mongodb-js/connection-form';

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
    backgroundColor: uiColors.gray.light2,
  },
});

const connectionButtonStylesDark = css({
  '&:hover': {
    background: uiColors.gray.dark2,
  },
});

const connectionTitleStyles = css({
  fontSize: compassFontSizes.defaultFontSize,
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
      className={cx(
        css({
          background: favoriteColorHex,
          height: 'calc(100% - 4px)',
          width: spacing[2],
          borderRadius: spacing[2],
          margin: '2px 0',
          marginRight: spacing[2],
          gridArea: 'color',
        }),
        className
      )}
    ></div>
  );
}

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

  const { theme } = useTheme();

  const { connectionColorToHex } = useConnectionColor();
  const favoriteColorHex = connectionColorToHex(favorite?.color) ?? '';

  const hasColoredBackground = isActive && favoriteColorHex;
  const normalTitleColor =
    theme === Theme.Dark ? uiColors.white : uiColors.gray.dark3;
  const titleColor = hasColoredBackground ? uiColors.black : normalTitleColor;
  const backgroundColor = hasColoredBackground
    ? `${favoriteColorHex} !important`
    : 'none';

  const normalDescriptionColor =
    theme === Theme.Dark ? uiColors.gray.light1 : uiColors.gray.base;
  const descriptionColor = hasColoredBackground
    ? uiColors.gray.dark3
    : normalDescriptionColor;

  const normalConnectionMenuColor =
    theme === Theme.Dark ? 'white' : uiColors.gray.base;
  const connectionMenuColor = hasColoredBackground
    ? uiColors.gray.dark3
    : normalConnectionMenuColor;

  const actions = useMemo(() => {
    const actions: ItemAction<Action>[] = [];

    actions.push({
      action: 'copy-connection-string',
      label: 'Copy connection string',
      icon: 'Copy',
    });

    actions.push({
      action: 'duplicate-connection',
      label: 'Duplicate',
      icon: 'Clone',
    });

    actions.push({
      action: 'remove-connection',
      label: 'Remove',
      icon: 'Trash',
    });

    return actions;
  }, []);

  const { openToast } = useToast('compass-connections');

  const onAction = useCallback(
    (action) => {
      console.log(action);

      async function copyConnectionString(connectionString: string) {
        try {
          await navigator.clipboard.writeText(connectionString);
          openToast('copy-to-clipboard', {
            title: 'Success',
            body: 'Copied to clipboard.',
            variant: ToastVariant.Success,
            timeout: TOAST_TIMEOUT_MS,
          });
        } catch (err) {
          openToast('copy-to-clipboard', {
            title: 'Error',
            body: 'An error occurred when copying to clipboard. Please try again.',
            variant: ToastVariant.Warning,
            timeout: TOAST_TIMEOUT_MS,
          });
        }
      }

      if (action === 'copy-connection-string') {
        void copyConnectionString(
          connectionInfo.connectionOptions.connectionString
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
        className={cx(
          connectionButtonStyles,
          theme === Theme.Dark
            ? connectionButtonStylesDark
            : connectionButtonStylesLight,
          css({ background: backgroundColor })
        )}
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
          className={cx(
            connectionTitleStyles,
            css({
              color: titleColor,
            })
          )}
          data-testid={`${favorite ? 'favorite' : 'recent'}-connection-title`}
          title={connectionTitle}
        >
          {connectionTitle}
        </H3>
        <Description
          className={cx(
            connectionDescriptionStyles,
            css({
              color: descriptionColor,
            })
          )}
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
          iconClassName={css({
            color: connectionMenuColor,
          })}
        ></ItemActionControls>
      </div>
    </div>
  );
}

export default Connection;
