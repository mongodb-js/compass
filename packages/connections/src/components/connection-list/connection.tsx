/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Button,
  Subtitle,
  Description,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo, getConnectionTitle } from 'mongodb-data-service';

import ConnectionMenu from './connection-menu';

const connectionButtonStyles = css({
  position: 'absolute',
  margin: 0,
  padding: 0,
  height: 'auto',
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
  '> div': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    textAlign: 'left',
    height: 'auto',
    width: '100%',
    padding: 0,
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    position: 'relative',
  },
});

const connectionButtonContainerStyles = css({
  position: 'relative',
  height: 52,
  marginTop: spacing[2],
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
  '&:focus-within': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
      backgroundColor: uiColors.focus,
    },
  },
});

const connectionTitleStyles = css({
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
  margin: 0,
  marginTop: spacing[1],
  marginRight: spacing[2],
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

// Creates a date string formatted as `Oct 27, 2090, 2:06:04 PM EDT`.
const dateConfig: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  timeZoneName: 'short',
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
  connection,
}: {
  connection: ConnectionInfo;
}): React.ReactElement {
  const connectionTitle = connection.favorite
    ? connection.favorite.name
    : getTitleForConnection(connection);

  return (
    <div css={connectionButtonContainerStyles}>
      <Button
        // as="li"
        css={connectionButtonStyles}
        darkMode
        onClick={() => alert('clicked card')}
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
      </Button>
      <ConnectionMenu
        onClickDuplicate={() => alert('duplicate')}
        onClickRemove={() => alert('remove')}
      />
    </div>
  );
}

export default Connection;
