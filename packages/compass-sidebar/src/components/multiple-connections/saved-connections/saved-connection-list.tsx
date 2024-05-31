import type { ConnectionInfo } from '@mongodb-js/connection-info';
import React, { type CSSProperties, useCallback } from 'react';
import { SavedConnection } from './saved-connection';
import {
  Body,
  Button,
  Subtitle,
  Icon,
  IconButton,
  css,
  spacing,
  palette,
} from '@mongodb-js/compass-components';
import { ButtonVariant } from '@mongodb-js/compass-components';
import { useCanOpenNewConnections } from '@mongodb-js/compass-connections/provider';

const savedConnectionListStyles = css({
  width: '100%',
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  marginTop: 'auto',
  paddingTop: spacing[200],
  borderTop: `1px solid ${palette.gray.light2}`,
});

const savedConnectionListPaddingStyles = css({
  overflowY: 'auto',
  flexGrow: 1,
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const savedConnectionCountStyles = css({
  fontWeight: 'normal',
  marginLeft: spacing[100],
});

const savedConnectionListHeaderStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row',
  alignContent: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[200],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

const savedConnectionListHeaderTitleStyles = css({
  marginTop: 0,
  marginBottom: 0,
  textTransform: 'uppercase',
  fontSize: '12px',
  lineHeight: '32px',
});

const firstConnectionBtnStyles = css({
  width: '100%',
  marginTop: spacing[400],
});

const newConnectionWrapperStyles = css({
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});

type SavedConnectionListProps = {
  favoriteConnections: ConnectionInfo[];
  nonFavoriteConnections: ConnectionInfo[];
  height?: CSSProperties['height'];
  onConnect(connectionInfo: ConnectionInfo): void;
  onNewConnection(): void;
  onEditConnection(connectionInfo: ConnectionInfo): void;
  onDuplicateConnection(connectionInfo: ConnectionInfo): void;
  onDeleteConnection(connectionInfo: ConnectionInfo): void;
  onToggleFavoriteConnection(connectionInfo: ConnectionInfo): void;
};

export function SavedConnectionList({
  favoriteConnections,
  nonFavoriteConnections,
  onConnect: _onConnect,
  onNewConnection,
  onEditConnection,
  onDeleteConnection,
  onDuplicateConnection,
  onToggleFavoriteConnection,
  height = '320px',
}: SavedConnectionListProps): React.ReactElement {
  const {
    maximumNumberOfConnectionsOpen,
    canOpenNewConnection,
    canNotOpenReason,
  } = useCanOpenNewConnections();

  const onConnect = useCallback(
    (connectionInfo: ConnectionInfo) => {
      if (canOpenNewConnection) {
        _onConnect(connectionInfo);
      }
    },
    [_onConnect, canOpenNewConnection]
  );

  const connectionCount =
    favoriteConnections.length + nonFavoriteConnections.length;

  return (
    <div className={savedConnectionListStyles} style={{ height }}>
      <header className={savedConnectionListHeaderStyles}>
        <Subtitle className={savedConnectionListHeaderTitleStyles}>
          Connections
          {connectionCount !== 0 && (
            <span className={savedConnectionCountStyles}>
              ({connectionCount})
            </span>
          )}
        </Subtitle>
        <div>
          <IconButton
            aria-label="New Connection"
            title="New Connection"
            data-testid="new-connection-button"
            onClick={onNewConnection}
          >
            <Icon glyph="Plus"></Icon>
          </IconButton>
        </div>
      </header>
      {connectionCount ? (
        <ul className={savedConnectionListPaddingStyles}>
          {favoriteConnections.map((conn) => (
            <SavedConnection
              canOpenNewConnection={canOpenNewConnection}
              canNotOpenReason={canNotOpenReason}
              maximumNumberOfConnectionsOpen={maximumNumberOfConnectionsOpen}
              onConnect={onConnect}
              onEditConnection={onEditConnection}
              onDuplicateConnection={onDuplicateConnection}
              onToggleFavoriteConnection={onToggleFavoriteConnection}
              onDeleteConnection={onDeleteConnection}
              connectionInfo={conn}
              key={conn.id}
            />
          ))}
          {nonFavoriteConnections.map((conn) => (
            <SavedConnection
              canOpenNewConnection={canOpenNewConnection}
              canNotOpenReason={canNotOpenReason}
              maximumNumberOfConnectionsOpen={maximumNumberOfConnectionsOpen}
              onConnect={onConnect}
              onEditConnection={onEditConnection}
              onDuplicateConnection={onDuplicateConnection}
              onToggleFavoriteConnection={onToggleFavoriteConnection}
              onDeleteConnection={onDeleteConnection}
              connectionInfo={conn}
              key={conn.id}
            />
          ))}
        </ul>
      ) : (
        <div className={newConnectionWrapperStyles}>
          <Body>You have not connected to any deployments.</Body>
          <Button
            className={firstConnectionBtnStyles}
            data-testid="save-connection-button"
            variant={ButtonVariant.Primary}
            leftGlyph={<Icon glyph="Plus" />}
            onClick={onNewConnection}
          >
            Add new connection
          </Button>
        </div>
      )}
    </div>
  );
}
