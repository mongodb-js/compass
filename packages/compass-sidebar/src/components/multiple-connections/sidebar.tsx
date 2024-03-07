import React, { useCallback, useState } from 'react';
import { useConnections } from '@mongodb-js/compass-connections';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { SavedConnectionList } from './saved-connections/saved-connection-list';
import { OpenConnectionList } from './open-connections/open-connection-list';
import { ResizableSidebar, css } from '@mongodb-js/compass-components';
import { SidebarHeader } from './header/sidebar-header';

// Temporary as we don't need props but this placeholder type is useful.
type MultipleConnectionSidebarProps = Record<string, never>;

const sidebarStyles = css({
  // Sidebar internally has z-indexes higher than zero. We set zero on the
  // container so that the sidebar doesn't stick out in the layout z ordering
  // with other parts of the app
  zIndex: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
});

// TODO We will get rid of this placeholder when expose the necessary props outside
// eslint-disable-next-line
const noop_tmp = (() => {}) as any;

// Having props here is useful as a placeholder and we will fix it with the first props.
// eslint-disable-next-line
export function MultipleConnectionSidebar({}: MultipleConnectionSidebarProps) {
  const { favoriteConnections, recentConnections, removeConnection } =
    useConnections({
      onConnected: noop_tmp, // TODO: COMPASS-7710,
      isConnected: true, // TODO: COMPASS-7710
      connectFn: noop_tmp, // TODO: COMPASS-7710
      appName: '', // TODO: COMPASS-7710
      getAutoConnectInfo: noop_tmp, // TODO: COMPASS-7710
    });

  const [isExpanded, setIsExpanded] = useState(true);

  const onConnect = useCallback(
    // Placeholder for when we implement it
    // eslint-disable-next-line
    (info: ConnectionInfo) => {},
    []
  );

  const onNewConnection = useCallback(() => {
    // TODO: COMPASS-7710
  }, []);

  const onEditConnection = useCallback(
    // Placeholder for when we implement it
    // eslint-disable-next-line
    (info: ConnectionInfo) => {},
    []
  );

  const onDeleteConnection = useCallback(
    (info: ConnectionInfo) => {
      void removeConnection(info);
    },
    [removeConnection]
  );

  const onDuplicateConnection = useCallback(
    // Placeholder for when we implement it
    // eslint-disable-next-line
    (info: ConnectionInfo) => {},
    []
  );

  const onToggleFavoriteConnection = useCallback(
    // Placeholder for when we implement it
    // eslint-disable-next-line
    (info: ConnectionInfo) => {},
    []
  );

  return (
    <ResizableSidebar
      expanded={isExpanded}
      setExpanded={setIsExpanded}
      data-testid="navigation-sidebar"
    >
      <aside className={sidebarStyles}>
        <SidebarHeader />
        <OpenConnectionList />
        <SavedConnectionList
          favoriteConnections={favoriteConnections}
          nonFavoriteConnections={recentConnections}
          onConnect={onConnect}
          onNewConnection={onNewConnection}
          onEditConnection={onEditConnection}
          onDeleteConnection={onDeleteConnection}
          onDuplicateConnection={onDuplicateConnection}
          onToggleFavoriteConnection={onToggleFavoriteConnection}
        />
      </aside>
    </ResizableSidebar>
  );
}
