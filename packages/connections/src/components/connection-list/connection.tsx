import React from 'react';
import {
  H3,
  Description,
  spacing,
  uiColors,
  css,
  cx,
  useColorCode,
} from '@mongodb-js/compass-components';
import type { ConnectionInfo } from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';

import ConnectionMenu from './connection-menu';
import ConnectionIcon from './connection-icon';

const connectionMenuHiddenStyles = css({
  visibility: 'hidden',
});

const connectionMenuVisibleStyles = css({
  visibility: 'visible',
});

const connectionButtonContainerStyles = css({
  position: 'relative',
  padding: 0,
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
  paddingRight: 0,
  paddingBottom: spacing[1],
  paddingLeft: spacing[1] * 3,
  width: '100%',
  display: 'grid',
  gridTemplateAreas: `'icon title' '. description'`,
  gridTemplateColumns: 'auto 1fr',
  alignItems: 'center',
  justifyItems: 'start',
  border: 'none',
  borderRadius: 0,
  background: 'none',
  '&:hover': {
    border: 'none',
    background: uiColors.gray.dark2,
  },
  '&:focus': {
    border: 'none',
  },
});

const connectionTitleStyles = css({
  color: uiColors.white,
  fontWeight: 'bold',
  fontSize: '14px',
  lineHeight: '20px',
  margin: 0,
  flexGrow: 1,
  marginRight: spacing[4],
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

function getActiveConnectionStyles(color?: string) {
  const background = color ?? uiColors.gray.dark2;
  const labelColor = color ? uiColors.gray.dark3 : uiColors.gray.base;
  return css({
    background: `${background} !important`,
    color: uiColors.white,
    p: {
      color: labelColor,
    },
  });
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

  const { colorCodeToHex } = useColorCode();
  const favoriteColorHex = colorCodeToHex(favorite?.color);

  const color =
    isActive && favoriteColorHex
      ? uiColors.black
      : favoriteColorHex ?? uiColors.white;

  return (
    <div className={connectionButtonContainerStyles}>
      <button
        className={cx(
          connectionButtonStyles,
          isActive ? getActiveConnectionStyles(favoriteColorHex) : null
        )}
        data-testid={`saved-connection-button-${connectionInfo.id || ''}`}
        onClick={onClick}
        onDoubleClick={() => onDoubleClick(connectionInfo)}
      >
        <ConnectionIcon color={color} connectionString={connectionString} />
        <H3
          className={cx(
            connectionTitleStyles,
            css({
              color,
            })
          )}
          data-testid={`${favorite ? 'favorite' : 'recent'}-connection-title`}
          title={connectionTitle}
        >
          {connectionTitle}
        </H3>
        <Description
          className={connectionDescriptionStyles}
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
          iconColor={
            isActive && favorite && favoriteColorHex
              ? uiColors.gray.dark3
              : uiColors.white
          }
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
