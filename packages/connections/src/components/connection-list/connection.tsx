/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Button,
  // Card,
  IconButton,
  Icon,
  Subtitle,
  Description,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';

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
  '&:hover': {
    border: 'none',
  },
  '&:focus': {
    border: 'none'
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
    position: 'relative'
  }
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
    borderBottomRightRadius: spacing[1]
  },
  '&:hover': {
    '&::after': {
      opacity: 1,
      width: spacing[1]
    }
  },
  '&:focus-within': {
    '&::after': {
      opacity: 1,
      width: spacing[1],
      backgroundColor: uiColors.focus
    }
  }
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
  marginBottom: spacing[1]
});

const dropdownButtonStyles = css({
  color: 'white',
  position: 'absolute',
  right: spacing[1],
  top: spacing[2],
  bottom: 0,
})

function Connection({
  connection,
}: {
  connection: ConnectionInfo;
}): React.ReactElement {
  // TODO: Get title from connection string for non-favorites.
  const connectionTitle = connection.favorite
    ? connection.favorite.name
    : connection.connectionOptions.connectionString;

  return (
    <div
      css={connectionButtonContainerStyles}
    >
      <Button
        // as="li"
        css={connectionButtonStyles}
        darkMode
        contentStyle="clickable"
        onClick={() => alert('clicked card')}
      >
        <Subtitle
          css={[
            connectionTitleStyles,
            connection.favorite && connection.favorite.color
              ? css({
                color: connection.favorite.color
              })
              : null
          ]}
          title={connectionTitle}>
          {connectionTitle}
        </Subtitle>
        {connection.lastUsed && (
          <Description css={connectionDescriptionStyles}>
            {connection.lastUsed.toLocaleString()}
          </Description>
        )}
      </Button>
      <IconButton
        css={dropdownButtonStyles}
        onClick={() => alert('open menu')}
      >
        {/* TODO: Is vertical okay? It's currently horizontal */}
        <Icon glyph="VerticalEllipsis" />
      </IconButton>
    </div>
  );
}

export default Connection;
