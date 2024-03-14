import React, { useCallback, useMemo, useState } from 'react';
import { useConnections } from '@mongodb-js/compass-connections/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { SavedConnectionList } from './saved-connections/saved-connection-list';
import { OpenConnectionList } from './open-connections/open-connection-list';
import { ResizableSidebar, css } from '@mongodb-js/compass-components';
import { SidebarHeader } from './header/sidebar-header';
import { ConnectionFormModal } from '@mongodb-js/connection-form';
import { cloneDeep } from 'lodash';
import { usePreference } from 'compass-preferences-model/provider';

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
  const {
    connect,
    favoriteConnections,
    recentConnections,
    removeConnection,
    saveConnection,
    state,
  } = useConnections({
    onConnected: noop_tmp, // TODO: COMPASS-7710,
    onConnectionAttemptStarted: noop_tmp,
    onConnectionFailed: noop_tmp,
    isConnected: true, // TODO: COMPASS-7710
    connectFn: noop_tmp, // TODO: COMPASS-7710
    appName: '', // TODO: COMPASS-7710
    getAutoConnectInfo: noop_tmp, // TODO: COMPASS-7710
  });

  const { activeConnectionId, activeConnectionInfo, connectionErrorMessage } =
    state;

  const [isExpanded, setIsExpanded] = useState(true);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);

  const onConnect = useCallback(
    // Placeholder for when we implement it
    // eslint-disable-next-line
    (info: ConnectionInfo) => {},
    []
  );

  const onNewConnectionOpen = useCallback(
    () => setIsConnectionFormOpen(true),
    []
  );
  const onNewConnectionClose = useCallback(
    () => setIsConnectionFormOpen(false),
    []
  );
  const onNewConnectionToggle = useCallback(
    (open: boolean) => setIsConnectionFormOpen(open),
    []
  );

  const onNewConnectionConnect = useCallback(
    (connectionInfo) => {
      connect({
        ...cloneDeep(connectionInfo),
      }).then(() => setIsConnectionFormOpen(false));
    },
    [connect]
  );

  const onSaveNewConnection = useCallback(
    async (connectionInfo) => {
      await saveConnection(connectionInfo);
      setIsConnectionFormOpen(false);
    },
    [saveConnection]
  );

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

  const protectConnectionStrings = usePreference('protectConnectionStrings');
  const forceConnectionOptions = usePreference('forceConnectionOptions');
  const showKerberosPasswordField = usePreference('showKerberosPasswordField');
  const showOIDCDeviceAuthFlow = usePreference('showOIDCDeviceAuthFlow');
  const enableOidc = usePreference('enableOidc');
  const enableDebugUseCsfleSchemaMap = usePreference(
    'enableDebugUseCsfleSchemaMap'
  );
  const protectConnectionStringsForNewConnections = usePreference(
    'protectConnectionStringsForNewConnections'
  );

  const preferences = useMemo(
    () => ({
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
    }),
    [
      protectConnectionStrings,
      forceConnectionOptions,
      showKerberosPasswordField,
      showOIDCDeviceAuthFlow,
      enableOidc,
      enableDebugUseCsfleSchemaMap,
      protectConnectionStringsForNewConnections,
    ]
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
          onNewConnection={onNewConnectionOpen}
          onEditConnection={onEditConnection}
          onDeleteConnection={onDeleteConnection}
          onDuplicateConnection={onDuplicateConnection}
          onToggleFavoriteConnection={onToggleFavoriteConnection}
        />
        <ConnectionFormModal
          isOpen={isConnectionFormOpen}
          setOpen={onNewConnectionToggle}
          onCancel={onNewConnectionClose}
          onConnectClicked={onNewConnectionConnect}
          key={activeConnectionId}
          onSaveConnectionClicked={onSaveNewConnection}
          initialConnectionInfo={activeConnectionInfo}
          connectionErrorMessage={connectionErrorMessage}
          preferences={preferences}
        />
      </aside>
    </ResizableSidebar>
  );
}
