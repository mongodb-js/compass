import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useConnections } from '@mongodb-js/compass-connections/provider';
import {
  ConnectionInfo,
  getConnectionTitle,
} from '@mongodb-js/connection-info';
import { SavedConnectionList } from './saved-connections/saved-connection-list';
import { OpenConnectionList } from './open-connections/open-connection-list';
import {
  ResizableSidebar,
  css,
  Link,
  useToast,
  spacing,
} from '@mongodb-js/compass-components';
import { SidebarHeader } from './header/sidebar-header';
import { ConnectionFormModal } from '@mongodb-js/connection-form';
import { cloneDeep } from 'lodash';
import { usePreference } from 'compass-preferences-model/provider';
import type { DataService } from 'mongodb-data-service/provider';

type MultipleConnectionSidebarProps = {
  appName: string;
  connectFn?: (ConnectionInfo) => Promise<DataService>;
};

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

type ConnectionErrorToastBodyProps = {
  info: ConnectionInfo;
  onReview: () => void;
};

const connectionErrorToastBodyStyles = css({
  display: 'flex',
  alignItems: 'start',
  gap: spacing[2],
});

const connectionErrorToastActionMessageStyles = css({
  marginTop: spacing[1],
  flexGrow: 0,
});

function ConnectionErrorToastBody({
  info,
  onReview,
}: ConnectionErrorToastBodyProps): React.ReactElement {
  return (
    <span className={connectionErrorToastBodyStyles}>
      <span>There was a problem connecting to {getConnectionTitle(info)}</span>
      <Link
        className={connectionErrorToastActionMessageStyles}
        hideExternalIcon={true}
        onClick={onReview}
      >
        REVIEW
      </Link>
    </span>
  );
}
// Having props here is useful as a placeholder and we will fix it with the first props.
// eslint-disable-next-line
export function MultipleConnectionSidebar({
  appName,
  connectFn,
}: MultipleConnectionSidebarProps) {
  const { openToast, closeToast } = useToast('multiple-connection-status');
  const cancelCurrentConnectionRef = useRef<() => void>(undefined);

  const [isExpanded, setIsExpanded] = useState(true);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);

  const onConnected = useCallback(() => {
    closeToast('connection-status');
  }, [closeToast]);

  const onConnectionAttemptStarted = useCallback(
    (info: ConnectionInfo) => {
      const cancelAndCloseToast = () => {
        cancelCurrentConnectionRef.current?.();
        closeToast('connection-status');
      };

      openToast('connection-status', {
        title: `Connecting to ${getConnectionTitle(info)}`,
        dismissible: true,
        variant: 'progress',
        actionElement: (
          <Link hideExternalIcon={true} onClick={cancelAndCloseToast}>
            CANCEL
          </Link>
        ),
      });
    },
    [openToast, closeToast, cancelCurrentConnectionRef]
  );

  const onConnectionFailed = useCallback(
    (info: ConnectionInfo, error: Error) => {
      const reviewAndCloseToast = () => {
        closeToast('connection-status');
        setIsConnectionFormOpen(true);
      };

      openToast('connection-status', {
        title: `${error.message}`,
        description: (
          <ConnectionErrorToastBody
            info={info}
            onReview={reviewAndCloseToast}
          />
        ),
        variant: 'warning',
        timeout: 5000,
      });
    },
    [openToast, closeToast, setIsConnectionFormOpen]
  );

  const {
    setActiveConnectionById,
    connect,
    favoriteConnections,
    recentConnections,
    cancelConnectionAttempt,
    removeConnection,
    saveConnection,
    duplicateConnection,
    state,
  } = useConnections({
    onConnected: onConnected,
    onConnectionAttemptStarted: onConnectionAttemptStarted,
    onConnectionFailed: onConnectionFailed,
    isConnected: false,
    connectFn: connectFn,
    appName: appName,
  });

  const { activeConnectionId, activeConnectionInfo, connectionErrorMessage } =
    state;

  cancelCurrentConnectionRef.current = cancelConnectionAttempt;

  const onConnect = useCallback(
    async (info: ConnectionInfo) => {
      setActiveConnectionById(info.id);
      await connect(info);
    },
    [connect, setActiveConnectionById]
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
      void connect({
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

  const onDeleteConnection = useCallback(
    (info: ConnectionInfo) => {
      void removeConnection(info);
    },
    [removeConnection]
  );

  const onEditConnection = useCallback(
    // Placeholder for when we implement it
    // eslint-disable-next-line
    (info: ConnectionInfo) => {
      setActiveConnectionById(info.id);
      setIsConnectionFormOpen(true);
    },
    [setActiveConnectionById, setIsConnectionFormOpen]
  );

  const onDuplicateConnection = useCallback(
    (info: ConnectionInfo) => {
      duplicateConnection(info);
      setIsConnectionFormOpen(true);
    },
    [duplicateConnection, setIsConnectionFormOpen]
  );

  const onToggleFavoriteConnection = useCallback(
    (info: ConnectionInfo) => {
      info.savedConnectionType =
        info.savedConnectionType === 'favorite' ? 'recent' : 'favorite';

      void saveConnection(info);
    },
    [saveConnection]
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
