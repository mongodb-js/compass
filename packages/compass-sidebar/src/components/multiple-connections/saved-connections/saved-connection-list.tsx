import type { ConnectionInfo } from '@mongodb-js/connection-info';
import React from 'react';
import { SavedConnection } from './saved-connection';
import {
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
  height: '320px',
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  marginTop: 'auto',
  paddingTop: spacing[2],
  borderTop: `1px solid ${palette.gray.light2}`,
});

const savedConnectionListPaddingStyles = css({
  overflowY: 'auto',
  flexGrow: 1,
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
});

const savedConnectionCountStyles = css({
  fontWeight: 'normal',
});

const savedConnectionListHeaderStyles = css({
  flexGrow: 0,
  display: 'flex',
  flexDirection: 'row',
  alignContent: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[2],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
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
  marginTop: spacing[3],
});

type SavedConnectionListProps = {
  favoriteConnections: ConnectionInfo[];
  nonFavoriteConnections: ConnectionInfo[];
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
  onConnect,
  onNewConnection,
  onEditConnection,
  onDeleteConnection,
  onDuplicateConnection,
  onToggleFavoriteConnection,
}: SavedConnectionListProps): React.ReactElement {
  const {
    maximumNumberOfConnectionsOpen,
    canOpenNewConnection,
    canNotOpenReason,
  } = useCanOpenNewConnections();

  const connectionCount =
    favoriteConnections.length + nonFavoriteConnections.length;

  return (
    <div className={savedConnectionListStyles}>
      <header className={savedConnectionListHeaderStyles}>
        <Subtitle className={savedConnectionListHeaderTitleStyles}>
          Connections{' '}
          <span className={savedConnectionCountStyles}>
            ({connectionCount})
          </span>
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
        <div>
          You have not connected to any deployments
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
