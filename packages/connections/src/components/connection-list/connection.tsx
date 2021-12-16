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
  padding: `${spacing[1]}px 0 ${spacing[1]}px ${spacing[1] * 3}px`,
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
  width: '85%',
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
  const { connectionString } = connectionInfo.connectionOptions;
  const color =
    isActive && connectionInfo.favorite && connectionInfo.favorite.color
      ? uiColors.black
      : connectionInfo.favorite?.color ?? uiColors.white;

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
          <Subtitle
            className={cx(
              connectionTitleStyles,
              css({
                color,
              })
            )}
            data-testid={`${
              connectionInfo.favorite ? 'favorite' : 'recent'
            }-connection-title`}
            title={connectionTitle}
          >
            {connectionTitle}
          </Subtitle>
          {/* Last Used */}
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
        </div>
      </button>
      <div
        className={
          isActive ? connectionMenuVisibleStyles : connectionMenuHiddenStyles
        }
      >
        <ConnectionMenu connectionString={connectionString} />
      </div>
    </div>
  );
}

export default Connection;
