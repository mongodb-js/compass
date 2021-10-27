/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import {
  Card,
  Subtitle,
  Description,
  spacing,
  uiColors,
} from '@mongodb-js/compass-components';
import { ConnectionInfo } from 'mongodb-data-service';

const connectionCardStyles = css({
  position: 'relative',
  padding: `${spacing[2]}px ${spacing[3]}px`,
  margin: 0,
  marginTop: spacing[3],
  // width: '100%',
  maxHeight: 200,
  overflow: 'hidden',
});

const connectionTitleStyles = css({
  color: 'white',
  fontWeight: 'bold',
  fontSize: 14,
  margin: 0,
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
});

const favoriteColorStyles = css({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: 5,
});

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
    <Card
      css={connectionCardStyles}
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
          css={favoriteColorStyles}
          style={{
            backgroundColor: connection.favorite.color,
          }}
        />
      )}
    </Card>
  );
}

export default Connection;
