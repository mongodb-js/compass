import React from 'react';
import {
  H3,
  Description,
  compassFontSizes,
  spacing,
  uiColors,
  css,
  cx,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';

import ConnectionMenu from './connection-menu';
import ConnectionIcon from './connection-icon';
import { useConnectionColor } from '@mongodb-js/connection-form';

const connectionMenuHiddenStyles = css({
  visibility: 'hidden',
});

const connectionMenuVisibleStyles = css({
  visibility: 'visible',
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
  [`&:hover .${connectionMenuHiddenStyles}`]: connectionMenuVisibleStyles,
  '&:focus': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
    },
  },
  [`&:focus-within .${connectionMenuHiddenStyles}`]:
    connectionMenuVisibleStyles,
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
    background: uiColors.gray.dark2,
  },
  '&:focus': {
    border: 'none',
  },
});

const connectionTitleStyles = css({
  color: uiColors.white,
  fontSize: compassFontSizes.defaultFontSize,
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
  color: uiColors.gray.base,
  fontWeight: 'bold',
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
          height: '100%',
          width: spacing[2],
          borderRadius: spacing[2],
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

  const { connectionColorToHex } = useConnectionColor();
  const favoriteColorHex = connectionColorToHex(favorite?.color) ?? '';

  const hasColoredBackground = isActive && favoriteColorHex;
  const titleColor = hasColoredBackground ? uiColors.black : uiColors.white;
  const backgroundColor = hasColoredBackground
    ? `${favoriteColorHex} !important`
    : 'none';

  const descriptionColor = hasColoredBackground
    ? uiColors.gray.dark3
    : uiColors.gray.base;

  const connectionMenuColor = hasColoredBackground
    ? uiColors.gray.dark3
    : uiColors.white;

  return (
    <div className={connectionButtonContainerStyles}>
      <button
        className={cx(
          connectionButtonStyles,
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
            css({ color: descriptionColor })
          )}
          data-testid={`${
            favorite ? 'favorite' : 'recent'
          }-connection-description`}
        >
          {lastUsed ? lastUsed.toLocaleString('default', dateConfig) : 'Never'}
        </Description>
      </button>
      <div
        className={
          isActive ? connectionMenuVisibleStyles : connectionMenuHiddenStyles
        }
      >
        <ConnectionMenu
          iconColor={connectionMenuColor}
          connectionString={connectionInfo.connectionOptions.connectionString}
          connectionInfo={connectionInfo}
          duplicateConnection={duplicateConnection}
          removeConnection={removeConnection}
        />
      </div>
    </div>
  );
}

export default Connection;
