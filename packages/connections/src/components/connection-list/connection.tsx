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

// const connectionCardStyles = css({
//   position: 'relative',
//   padding: `${spacing[2]}px ${spacing[3]}px`,
//   margin: 0,
//   marginTop: spacing[3],
//   // width: '100%',
//   maxHeight: 200,
//   overflow: 'hidden',
// });

const connectionButtonStyles = css({
  position: 'absolute',
  margin: 0,
  // marginTop: spacing[2],
  padding: 0,
  // paddingTop: 10,
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
    // '&::after': {
    //   position: 'absolute',
    //   backgroundColor: 'red',
    //   left: 0,
    //   top: 0,
    //   bottom: 0,
    //   width: 5
    // }
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
    paddingLeft: spacing[4],
    paddingRight: spacing[4],
    position: 'relative'
  }
});

const connectionButtonContainerStyles = css({
  position: 'relative',
  height: 60,
  marginTop: spacing[2],
});

const connectionTitleStyles = css({
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
  margin: 0,
  marginTop: spacing[2],
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
  marginBottom: spacing[2]
});

const favoriteColorStyles = css({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: spacing[2],
  // height: 100
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
    // <Card
    //   css={connectionCardStyles}
    //   darkMode
    //   contentStyle="clickable"
    //   onClick={() => alert('clicked card')}
    // >
    //   <Subtitle css={connectionTitleStyles} title={connectionTitle}>
    //     {connectionTitle}
    //   </Subtitle>
    //   {connection.lastUsed && (
    //     <Description css={connectionDescriptionStyles}>
    //       {connection.lastUsed.toLocaleString()}
    //     </Description>
    //   )}
    //   {connection.favorite && connection.favorite.color && (
    //     <div
    //       css={favoriteColorStyles}
    //       style={{
    //         backgroundColor: connection.favorite.color,
    //       }}
    //     />
    //   )}
    // </Card>

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
        <Subtitle css={connectionTitleStyles} title={connectionTitle}>
          {connectionTitle}
        </Subtitle>
        {connection.lastUsed && (
          <Description css={connectionDescriptionStyles}>
            {connection.lastUsed.toLocaleString()}
          </Description>
        )}
        {connection.favorite && connection.favorite.color && (
          <div
            css={[favoriteColorStyles, css({
              backgroundColor: connection.favorite.color
            })]}
          />
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
