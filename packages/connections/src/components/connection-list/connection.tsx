import { css, cx } from '@emotion/css';
import React from 'react';
import {
  H3,
  Description,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo, getConnectionTitle } from 'mongodb-data-service';

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
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  border: 'none',
  borderRadius: 0,
  display: 'flex',
  flexDirection: 'row',
  textAlign: 'left',
  background: 'none',
  '&:hover': {
    border: 'none',
    background: uiColors.gray.dark2,
  },
  '&:focus': {
    border: 'none',
  },
});

const connectionDetailsContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  width: 'calc(100% - 20px)',
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
});

// Creates a date string formatted as `Oct 27, 3000, 2:06 PM`.
const dateConfig: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
};

function getActiveConnectionStyles({ favorite }: ConnectionInfo) {
  const background = favorite?.color ?? uiColors.gray.dark2;
  const labelColor = favorite?.color ? uiColors.gray.dark3 : uiColors.gray.base;
  return css({
    background,
    '&:hover': {
      background: uiColors.gray.dark2,
    },
    '&:focus': {
      background,
    },
    color: uiColors.white,
    'p': {
      color: labelColor,
    }
  });
}

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
  const { connectionOptions: {connectionString}, favorite, lastUsed } = connectionInfo;
  const color =
    isActive && favorite && favorite.color
      ? uiColors.black
      : favorite?.color ?? uiColors.white;

  return (
    <div className={connectionButtonContainerStyles}>
      <button
        className={cx(
          connectionButtonStyles,
          isActive ? getActiveConnectionStyles(connectionInfo) : null
        )}
        data-testid={`saved-connection-button-${connectionInfo.id || ''}`}
        onClick={onClick}
      >
        <ConnectionIcon color={color} connectionString={connectionString} />
        {/* Title and Last Used */}
        <div className={connectionDetailsContainerStyles}>
          {/* Title */}
          <H3
            className={cx(
              connectionTitleStyles,
              css({
                color,
              })
            )}
            data-testid={`${
              favorite ? 'favorite' : 'recent'
            }-connection-title`}
            title={connectionTitle}
          >
            {connectionTitle}
          </H3>
          {/* Last Used */}
          {lastUsed && (
            <Description
              className={connectionDescriptionStyles}
              data-testid={`${
                favorite ? 'favorite' : 'recent'
              }-connection-description`}
            >
              {lastUsed.toLocaleString('default', dateConfig)}
            </Description>
          )}
        </div>
      </button>
      <div
        className={
          isActive ? connectionMenuVisibleStyles : connectionMenuHiddenStyles
        }
      >
        <ConnectionMenu
          iconColor={isActive && favorite && favorite.color ? uiColors.gray.dark3 : uiColors.white}
          connectionString={connectionString}
        />
      </div>
    </div>
  );
}

export default Connection;
