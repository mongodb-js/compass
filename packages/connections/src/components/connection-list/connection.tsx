/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Subtitle,
  Description,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo, getConnectionTitle } from 'mongodb-data-service';

const connectionButtonContainerStyles = css({
  position: 'relative',
  marginTop: spacing[1],
  padding: 0,
  '&::after': {
    position: 'absolute',
    content: '""',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    backgroundColor: 'white',
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
  '&:focus': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
      backgroundColor: uiColors.focus,
    },
  },
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
  background: uiColors.gray.dark3,
});

const connectionTitleStyles = css({
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
  margin: 0,
  marginTop: spacing[1],
  marginRight: spacing[2],
  width: '100%',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const connectionDescriptionStyles = css({
  color: uiColors.gray.light1,
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

function getTitleForConnection(connection: ConnectionInfo) {
  try {
    const title = getConnectionTitle(connection);
    return title;
  } catch (e) {
    // When parsing a saved connection fails we default the title.
    // TODO: What should the default name be here?
    return 'Recent Connection';
  }
}

function Connection({
  isActive,
  connection,
  onClick,
}: {
  isActive: boolean;
  connection: ConnectionInfo;
  onClick: () => void;
}): React.ReactElement {
  const connectionTitle = connection.favorite
    ? connection.favorite.name
    : getTitleForConnection(connection);

  return (
    <div css={connectionButtonContainerStyles}>
      <button
        css={[connectionButtonStyles, isActive ? activeConnectionStyles : null]}
        onClick={onClick}
      >
        <Subtitle
          css={[
            connectionTitleStyles,
            connection.favorite && connection.favorite.color
              ? css({
                  color: connection.favorite.color,
                })
              : null,
          ]}
          title={connectionTitle}
        >
          {connectionTitle}
        </Subtitle>
        {connection.lastUsed && (
          <Description css={connectionDescriptionStyles}>
            {connection.lastUsed.toLocaleString('default', dateConfig)}
          </Description>
        )}
      </button>
    </div>
  );
}

export default Connection;
