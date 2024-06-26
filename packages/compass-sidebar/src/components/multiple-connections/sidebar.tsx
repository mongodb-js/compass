import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { connect } from 'react-redux';
import {
  ConnectionStatus,
  useConnections,
  useConnectionsWithStatus,
} from '@mongodb-js/compass-connections/provider';
import {
  type ConnectionInfo,
  getConnectionTitle,
} from '@mongodb-js/connection-info';
import {
  ResizableSidebar,
  css,
  Link,
  useToast,
  spacing,
  openToast,
  HorizontalRule,
  SelectConnectionModal,
} from '@mongodb-js/compass-components';
import { SidebarHeader } from './header/sidebar-header';
import { ConnectionFormModal } from '@mongodb-js/connection-form';
import { cloneDeep } from 'lodash';
import { usePreference } from 'compass-preferences-model/provider';
import type { SidebarThunkAction } from '../../modules';
import { Navigation, type NavigationItem } from './navigation/navigation';
import ConnectionInfoModal from '../connection-info-modal';
import { useMaybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { useGlobalAppRegistry } from 'hadron-app-registry';
import ConnectionsNavigation from './connections-navigation';
import {
  useOpenWorkspace,
  useWorkspacePlugins,
} from '@mongodb-js/compass-workspaces/provider';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

type MultipleConnectionSidebarProps = {
  activeWorkspace: WorkspaceTab | null;
  onSidebarAction(action: string, ...rest: any[]): void;
};

const sidebarStyles = css({
  // Sidebar internally has z-indexes higher than zero. We set zero on the
  // container so that the sidebar doesn't stick out in the layout z ordering
  // with other parts of the app
  zIndex: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  paddingTop: spacing[400],
  gap: spacing[200],
});

type ConnectionErrorToastBodyProps = {
  info: ConnectionInfo | null;
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
      <span>
        There was a problem connecting{' '}
        {info ? `to ${getConnectionTitle(info)}` : ''}
      </span>
      {info && (
        <Link
          className={connectionErrorToastActionMessageStyles}
          hideExternalIcon={true}
          onClick={onReview}
        >
          REVIEW
        </Link>
      )}
    </span>
  );
}

function ShellSelectConnectionModal({
  connections,
  isModalOpen,
  onSubmit,
  onClose,
}: {
  connections: { id: string; name: string }[];
  isModalOpen: boolean;
  onSubmit(connectionId: string): void;
  onClose(): void;
}) {
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  const handleSubmit = useCallback(() => {
    if (selectedConnectionId) {
      onSubmit(selectedConnectionId);
    }
  }, [selectedConnectionId, onSubmit]);
  return (
    <SelectConnectionModal
      isModalOpen={isModalOpen}
      isSubmitDisabled={!selectedConnectionId}
      submitButtonText="Open shell"
      connections={connections}
      selectedConnectionId={selectedConnectionId ?? ''}
      onClose={onClose}
      onSubmit={handleSubmit}
      onConnectionSelected={setSelectedConnectionId}
    />
  );
}

async function copyConnectionString(connectionString: string) {
  try {
    await navigator.clipboard.writeText(connectionString);
    openToast('copy-to-clipboard', {
      title: 'Success',
      description: 'Copied to clipboard.',
      variant: 'success',
      timeout: TOAST_TIMEOUT_MS,
    });
  } catch {
    openToast('copy-to-clipboard', {
      title: 'Error',
      description:
        'An error occurred when copying to clipboard. Please try again.',
      variant: 'warning',
      timeout: TOAST_TIMEOUT_MS,
    });
  }
}

function useMemoisedFormPreferences() {
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

  return useMemo(
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
}

export function MultipleConnectionSidebar({
  activeWorkspace,
  onSidebarAction,
}: MultipleConnectionSidebarProps) {
  const [activeConnectionsFilterRegex, setActiveConnectionsFilterRegex] =
    useState<RegExp | null>(null);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);
  const [selectConnectionModalOpen, setSelectConnectionModalOpen] =
    useState(false);
  const [connectionInfoModalConnectionId, setConnectionInfoModalConnectionId] =
    useState<string | undefined>();

  const appRegistry = useGlobalAppRegistry();
  const formPreferences = useMemoisedFormPreferences();
  const { hasWorkspacePlugin } = useWorkspacePlugins();
  const { openMyQueriesWorkspace, openShellWorkspace } = useOpenWorkspace();
  const { openToast, closeToast } = useToast('multiple-connection-status');
  const maybeProtectConnectionString = useMaybeProtectConnectionString();
  const connectionsWithStatus = useConnectionsWithStatus();
  const {
    setActiveConnectionById,
    connect,
    closeConnection,
    cancelConnectionAttempt,
    removeConnection,
    saveConnection,
    duplicateConnection,
    createNewConnection,
    state: { activeConnectionId, activeConnectionInfo, connectionErrorMessage },
  } = useConnections();

  const findActiveConnection = (id: string) => {
    return connectionsWithStatus.find(
      ({ connectionInfo, connectionStatus }) => {
        return (
          connectionInfo.id === id &&
          connectionStatus === ConnectionStatus.Connected
        );
      }
    )?.connectionInfo;
  };

  const cancelCurrentConnectionRef = useRef<(id: string) => Promise<void>>();
  cancelCurrentConnectionRef.current = cancelConnectionAttempt;

  const navigationItems = useMemo(() => {
    const items: NavigationItem[] = [];
    if (hasWorkspacePlugin('My Queries')) {
      items.push({
        id: 'My Queries',
        glyph: 'CurlyBraces',
        label: 'My Queries',
        isActive: activeWorkspace?.type === 'My Queries',
      });
    }

    if (hasWorkspacePlugin('Shell')) {
      items.push({
        id: 'MongoDB Shell',
        glyph: 'Shell',
        label: 'MongoDB Shell',
        isActive: activeWorkspace?.type === 'Shell',
        isDisabled: connectionsWithStatus.length === 0,
        disabledTooltip: 'Add a connection first',
      });
    }
    return items;
  }, [activeWorkspace, hasWorkspacePlugin, connectionsWithStatus]);

  const connectionsForSelectConnectionsModal = useMemo(() => {
    return connectionsWithStatus.map(({ connectionInfo }) => ({
      id: connectionInfo.id,
      name: getConnectionTitle(connectionInfo),
    }));
  }, [connectionsWithStatus]);

  const onActiveConnectionFilterChange = useCallback(
    (filterRegex: RegExp | null) =>
      setActiveConnectionsFilterRegex(filterRegex),
    [setActiveConnectionsFilterRegex]
  );

  const onConnected = useCallback(
    (info: ConnectionInfo) => {
      openToast(`connection-status-${info.id}`, {
        title: `Connected to ${getConnectionTitle(info)}`,
        variant: 'success',
        timeout: 3_000,
      });
    },
    [openToast]
  );

  const onConnectionAttemptStarted = useCallback(
    (info: ConnectionInfo, titlePrefix = 'Connecting to') => {
      const cancelAndCloseToast = () => {
        void cancelCurrentConnectionRef.current?.(info.id);
        closeToast(`connection-status-${info.id}`);
      };

      openToast(`connection-status-${info.id}`, {
        title: `${titlePrefix} ${getConnectionTitle(info)}`,
        dismissible: true,
        variant: 'progress',
        actionElement: (
          <Link hideExternalIcon={true} onClick={cancelAndCloseToast}>
            CANCEL
          </Link>
        ),
      });
    },
    [openToast, closeToast]
  );

  const onConnectionFailed = useCallback(
    (info: ConnectionInfo | null, error: Error) => {
      const reviewAndCloseToast = () => {
        closeToast(`connection-status-${info?.id ?? ''}`);
        setIsConnectionFormOpen(true);
      };

      openToast(`connection-status-${info?.id ?? ''}`, {
        title: `${error.message}`,
        description: (
          <ConnectionErrorToastBody
            info={info}
            onReview={reviewAndCloseToast}
          />
        ),
        variant: 'warning',
      });
    },
    [openToast, closeToast, setIsConnectionFormOpen]
  );

  const onConnect = useCallback(
    (info: ConnectionInfo) => {
      setActiveConnectionById(info.id);
      onConnectionAttemptStarted(info);
      void connect(info).then(
        () => {
          onConnected(info);
        },
        (err: Error) => {
          void onConnectionFailed(info, err);
        }
      );
    },
    [
      connect,
      onConnected,
      onConnectionAttemptStarted,
      onConnectionFailed,
      setActiveConnectionById,
    ]
  );

  const onNewConnectionOpen = useCallback(() => {
    createNewConnection();
    setIsConnectionFormOpen(true);
  }, [createNewConnection]);

  const onNewConnectionClose = useCallback(
    () => setIsConnectionFormOpen(false),
    []
  );

  const onNewConnectionToggle = useCallback(
    (open: boolean) => setIsConnectionFormOpen(open),
    []
  );

  const onNewConnectionConnect = useCallback(
    (connectionInfo: ConnectionInfo) => {
      void connect({
        ...cloneDeep(connectionInfo),
      }).then(() => setIsConnectionFormOpen(false));
    },
    [connect]
  );

  const onSaveNewConnection = useCallback(
    async (connectionInfo: ConnectionInfo) => {
      await saveConnection(connectionInfo);
      setIsConnectionFormOpen(false);
    },
    [saveConnection]
  );

  const onRemoveConnection = useCallback(
    (info: ConnectionInfo) => {
      void removeConnection(info);
    },
    [removeConnection]
  );

  const onEditConnection = useCallback(
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

  const onToggleFavoriteConnectionInfo = useCallback(
    (info: ConnectionInfo) => {
      info.savedConnectionType =
        info.savedConnectionType === 'favorite' ? 'recent' : 'favorite';

      void saveConnection(info);
    },
    [saveConnection]
  );

  const onOpenConnectionInfo = useCallback(
    (connectionId: string) => setConnectionInfoModalConnectionId(connectionId),
    []
  );

  const onCloseConnectionInfo = useCallback(
    () => setConnectionInfoModalConnectionId(undefined),
    []
  );

  const onCopyConnectionString = useCallback(
    (connectionInfo: ConnectionInfo) => {
      void copyConnectionString(
        maybeProtectConnectionString(
          connectionInfo?.connectionOptions.connectionString
        )
      );
    },
    [maybeProtectConnectionString]
  );

  const onDisconnect = useCallback(
    (connectionId: string) => {
      void closeConnection(connectionId);
    },
    [closeConnection]
  );

  const connectAndOpenShell = useCallback(
    (connectionInfo: ConnectionInfo) => {
      setActiveConnectionById(connectionInfo.id);
      onConnectionAttemptStarted(connectionInfo, 'Opening MongoDB Shell for');
      void connect(connectionInfo)
        .then(() => {
          openShellWorkspace(connectionInfo.id, { newTab: true });
          closeToast(`connection-status-${connectionInfo.id}`);
        })
        .catch((err) => onConnectionFailed(connectionInfo, err));
    },
    [
      setActiveConnectionById,
      onConnectionAttemptStarted,
      connect,
      closeToast,
      openShellWorkspace,
      onConnectionFailed,
    ]
  );

  const openShellForSelectedConnection = useCallback(
    ({ id }: Pick<ConnectionInfo, 'id'>) => {
      const connection = connectionsWithStatus.find(
        ({ connectionInfo }) => connectionInfo.id === id
      );
      if (!connection) {
        return;
      }

      if (connection.connectionStatus === ConnectionStatus.Connected) {
        openShellWorkspace(connection.connectionInfo.id, { newTab: true });
        return;
      }

      connectAndOpenShell(connection.connectionInfo);
    },
    [connectionsWithStatus, connectAndOpenShell, openShellWorkspace]
  );

  const openShell = useCallback(() => {
    if (!connectionsWithStatus.length) {
      // Cannot open shell without a connection
      return;
    }

    if (connectionsWithStatus.length > 1) {
      setSelectConnectionModalOpen(true);
      return;
    }

    openShellForSelectedConnection(connectionsWithStatus[0].connectionInfo);
  }, [connectionsWithStatus, openShellForSelectedConnection]);

  const onNavigationItemClick = useCallback(
    (item: string) => {
      if (item === 'My Queries') {
        openMyQueriesWorkspace();
      } else if (item === 'MongoDB Shell') {
        openShell();
      }
    },
    [openMyQueriesWorkspace, openShell]
  );

  const onSelectConnectionModalClosed = useCallback(() => {
    setSelectConnectionModalOpen(false);
  }, []);

  const onSelectConnectionModalSubmit = useCallback(
    (id: string) => {
      setSelectConnectionModalOpen(false);
      openShellForSelectedConnection({ id });
    },
    [openShellForSelectedConnection]
  );

  useEffect(() => {
    // TODO(COMPASS-7397): don't hack this via the app registry
    appRegistry.on('open-new-connection', onNewConnectionOpen);
    return () => {
      appRegistry.removeListener('open-new-connection', onNewConnectionOpen);
    };
  }, [appRegistry, onNewConnectionOpen]);

  return (
    <ResizableSidebar data-testid="navigation-sidebar" useNewTheme={true}>
      <aside className={sidebarStyles}>
        <SidebarHeader onAction={onSidebarAction} />
        <Navigation
          items={navigationItems}
          onItemClick={onNavigationItemClick}
        />
        <HorizontalRule />
        <ConnectionsNavigation
          connectionsWithStatus={connectionsWithStatus}
          activeWorkspace={activeWorkspace}
          filterRegex={activeConnectionsFilterRegex}
          onFilterChange={onActiveConnectionFilterChange}
          onConnect={onConnect}
          onNewConnection={onNewConnectionOpen}
          onEditConnection={onEditConnection}
          onRemoveConnection={onRemoveConnection}
          onDuplicateConnection={onDuplicateConnection}
          onCopyConnectionString={onCopyConnectionString}
          onToggleFavoriteConnectionInfo={onToggleFavoriteConnectionInfo}
          onOpenConnectionInfo={onOpenConnectionInfo}
          onDisconnect={onDisconnect}
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
          preferences={formPreferences}
        />
        <ConnectionInfoModal
          connectionInfo={
            connectionInfoModalConnectionId
              ? findActiveConnection(connectionInfoModalConnectionId)
              : undefined
          }
          isVisible={!!connectionInfoModalConnectionId}
          close={onCloseConnectionInfo}
        />
        <ShellSelectConnectionModal
          connections={connectionsForSelectConnectionsModal}
          isModalOpen={selectConnectionModalOpen}
          onClose={onSelectConnectionModalClosed}
          onSubmit={onSelectConnectionModalSubmit}
        />
      </aside>
    </ResizableSidebar>
  );
}

const onSidebarAction = (
  action: string,
  ...rest: any[]
): SidebarThunkAction<void> => {
  return (_dispatch, _getState, { globalAppRegistry }) => {
    globalAppRegistry.emit(action, ...rest);
  };
};

const MappedMultipleConnectionSidebar = connect(undefined, {
  onSidebarAction,
})(MultipleConnectionSidebar);

export default MappedMultipleConnectionSidebar;
