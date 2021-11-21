import { css, cx } from '@emotion/css';
import React from 'react';
import {
  Subtitle,
  Description,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo, getConnectionTitle } from 'mongodb-data-service';

import ConnectionMenu from './connection-menu';

const connectionMenuHiddenStyles = css({
  visibility: 'hidden',
});

const connectionMenuVisibleStyles = css({
  visibility: 'visible',
});

const connectionButtonContainerStyles = css({
  position: 'relative',
  marginTop: spacing[1],
  padding: 0,
  width: '100%',
  '&::after': {
    position: 'absolute',
    content: '""',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    backgroundColor: uiColors.white,
    zIndex: 1,
    opacity: 0,
    transition: '150ms all',
    borderTopRightRadius: spacing[1],
    borderBottomRightRadius: spacing[1],
  },
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
      backgroundColor: uiColors.focus,
    },
  },
  [`&:focus-within .${connectionMenuHiddenStyles}`]:
    connectionMenuVisibleStyles,
  '&:focus-within': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
      backgroundColor: uiColors.focus,
    },
  },
});

const connectionButtonStyles = css({
  margin: 0,
  padding: 0,
  paddingLeft: spacing[4],
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  border: 'none',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'left',
  background: 'none',
  '&:hover': {
    border: 'none',
    background: uiColors.blue.dark3,
  },
  '&:focus': {
    border: 'none',
    background: uiColors.blue.dark3,
  },
});

const activeConnectionStyles = css({
  background: uiColors.gray.dark2,
});

const connectionTitleContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  marginTop: spacing[1],
  position: 'relative',
  width: '100%',
});

const connectionFavoriteStyles = css({
  borderRadius: '50%',
  width: 14,
  height: 14,
  flexShrink: 0,
  marginTop: spacing[1],
  marginRight: spacing[2],
});

const connectionTitleStyles = css({
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
  margin: 0,
  flexGrow: 1,
  marginRight: spacing[4],
  width: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const connectionDescriptionStyles = css({
  color: uiColors.gray.base,
  fontWeight: 'bold',
  fontSize: 12,
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginBottom: spacing[1],
});

// Creates a date string formatted as `Oct 27, 3000, 2:06 PM`.
const dateConfig: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

function Connection({
  isActive,
  connectionInfo,
  onClick,
}: {
  isActive: boolean;
  connectionInfo: ConnectionInfo;
  onClick: () => void;
}): React.ReactElement {
  const connectionTitle = getConnectionTitle(connectionInfo);

  return (
    <div className={connectionButtonContainerStyles}>
      <button
        className={cx(
          connectionButtonStyles,
          isActive ? activeConnectionStyles : null
        )}
        data-testid={`saved-connection-button-${connectionInfo.id || ''}`}
        onClick={onClick}
      >
        <div className={connectionTitleContainerStyles}>
          {!!(connectionInfo.favorite && connectionInfo.favorite.color) && (
            <div
              data-testid="connection-favorite-indicator"
              className={cx(
                connectionFavoriteStyles,
                css({
                  backgroundColor: connectionInfo.favorite.color,
                })
              )}
            />
          )}
          <Subtitle
            className={cx(
              connectionTitleStyles,
              connectionInfo.favorite && connectionInfo.favorite.color
                ? css({
                    color: connectionInfo.favorite.color,
                  })
                : null
            )}
            data-testid={`${
              connectionInfo.favorite ? 'favorite' : 'recent'
            }-connection-title`}
            title={connectionTitle}
          >
            {connectionTitle}
          </Subtitle>
        </div>
        {connectionInfo.lastUsed && (
          <Description
            className={connectionDescriptionStyles}
            data-testid={`${
              connectionInfo.favorite ? 'favorite' : 'recent'
            }-connection-description`}
          >
            {connectionInfo.lastUsed.toLocaleString('default', dateConfig)}
          </Description>
        )}
      </button>
      <div
        className={
          isActive ? connectionMenuVisibleStyles : connectionMenuHiddenStyles
        }
      >
        <ConnectionMenu
          connectionString={connectionInfo.connectionOptions.connectionString}
        />
      </div>
    </div>
  );
}

export default Connection;
