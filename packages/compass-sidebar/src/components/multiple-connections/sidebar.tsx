import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from 'react';
import { type MapStateToProps, connect } from 'react-redux';
import {
  ConnectionStatus,
  useActiveConnections,
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
} from '@mongodb-js/compass-components';
import { getGenuineMongoDB } from 'mongodb-build-info';
import { SidebarHeader } from './header/sidebar-header';
import { ConnectionFormModal } from '@mongodb-js/connection-form';
import { usePreference } from 'compass-preferences-model/provider';
import { type RootState, type SidebarThunkAction } from '../../modules';
import { Navigation } from './navigation/navigation';
import ConnectionInfoModal from '../connection-info-modal';
import { useMaybeProtectConnectionString } from '@mongodb-js/compass-maybe-protect-connection-string';
import type { WorkspaceTab } from '@mongodb-js/compass-workspaces';
import { useGlobalAppRegistry } from 'hadron-app-registry';
import ConnectionsNavigation from './connections-navigation';
import NonGenuineWarningModal from '../non-genuine-warning-modal';
import CSFLEConnectionModal, {
  type CSFLEConnectionModalProps,
} from '../csfle-connection-modal';
import { setConnectionIsCSFLEEnabled } from '../../modules/data-service';

const TOAST_TIMEOUT_MS = 5000; // 5 seconds.

type MappedCsfleModalProps = {
  connectionId: string | undefined;
} & Omit<CSFLEConnectionModalProps, 'open'>;

const mapStateForCsfleModal: MapStateToProps<
  Pick<CSFLEConnectionModalProps, 'open' | 'csfleMode'>,
  Pick<MappedCsfleModalProps, 'connectionId'>,
  RootState
> = ({ instance }, { connectionId }) => {
  const connectionInstance = connectionId ? instance[connectionId] : null;
  return {
    open: !!(connectionId && connectionInstance),
    csfleMode: connectionInstance?.csfleMode,
  };
};

const MappedCsfleModal = connect(mapStateForCsfleModal)(CSFLEConnectionModal);

type MultipleConnectionSidebarProps = {
  activeWorkspace: WorkspaceTab | null;
  onConnectionCsfleModeChanged(connectionId: string, isEnabled: boolean): void;
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
      <span data-testid="connection-error-text">
        There was a problem connecting{' '}
        {info ? `to ${getConnectionTitle(info)}` : ''}
      </span>
      {info && (
        <Link
          className={connectionErrorToastActionMessageStyles}
          hideExternalIcon={true}
          onClick={onReview}
          data-testid="connection-error-review"
        >
          REVIEW
        </Link>
      )}
    </span>
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
  onConnectionCsfleModeChanged,
}: MultipleConnectionSidebarProps) {
  const [genuineMongoDBModalVisible, setGenuineMongoDBModalVisible] =
    useState(false);
  const [csfleModalConnectionId, setCsfleModalConnectionId] = useState<
    string | undefined
  >(undefined);
  const [activeConnectionsFilterRegex, setActiveConnectionsFilterRegex] =
    useState<RegExp | null>(null);
  const [isConnectionFormOpen, setIsConnectionFormOpen] = useState(false);
  const [connectionInfoModalConnectionId, setConnectionInfoModalConnectionId] =
    useState<string | undefined>();

  const appRegistry = useGlobalAppRegistry();
  const formPreferences = useMemoisedFormPreferences();
  const { openToast, closeToast } = useToast('multiple-connection-status');
  const maybeProtectConnectionString = useMaybeProtectConnectionString();
  const connectionsWithStatus = useConnectionsWithStatus();
  const activeConnections = useActiveConnections();
  const maxConcurrentConnections = usePreference(
    'maximumNumberOfActiveConnections'
  ) as number;
  const {
    setActiveConnectionById,
    connect,
    closeConnection,
    cancelConnectionAttempt,
    removeConnection,
    saveConnection,
    createNewConnection,
    createDuplicateConnection,
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

      const { isGenuine } = getGenuineMongoDB(
        info.connectionOptions.connectionString
      );
      if (!isGenuine) {
        setGenuineMongoDBModalVisible(true);
      }
    },
    [openToast]
  );

  const onConnectionAttemptStarted = useCallback(
    (info: ConnectionInfo) => {
      const cancelAndCloseToast = () => {
        void cancelCurrentConnectionRef.current?.(info.id);
        closeToast(`connection-status-${info.id}`);
      };

      openToast(`connection-status-${info.id}`, {
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

  const onMaxConcurrentConnectionsLimitReached = useCallback(
    (
      currentActiveConnections: number,
      maxConcurrentConnections: number,
      connectionId: string
    ) => {
      const message = `Only ${maxConcurrentConnections} connection${
        currentActiveConnections > 1 ? 's' : ''
      } can be connected to at the same time. First disconnect from another connection.`;

      openToast(`connection-status-${connectionId}`, {
        title: 'Maximum concurrent connections limit reached',
        description: message,
        variant: 'warning',
        timeout: 5_000,
      });
    },
    [openToast]
  );

  const _onConnect = useCallback(
    async (info: ConnectionInfo): Promise<void> => {
      if (activeConnections.length >= maxConcurrentConnections) {
        onMaxConcurrentConnectionsLimitReached(
          activeConnections.length,
          maxConcurrentConnections,
          info.id
        );
        return;
      }
      setActiveConnectionById(info.id);
      onConnectionAttemptStarted(info);
      await connect(info).then(
        () => {
          onConnected(info);
        },
        (err: Error) => {
          void onConnectionFailed(info, err);
        }
      );
    },
    [
      maxConcurrentConnections,
      activeConnections,
      onMaxConcurrentConnectionsLimitReached,
      connect,
      onConnected,
      onConnectionAttemptStarted,
      onConnectionFailed,
      setActiveConnectionById,
    ]
  );

  const onConnect = useCallback(
    (info: ConnectionInfo) => {
      void _onConnect(info);
    },
    [_onConnect]
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
      setIsConnectionFormOpen(false);
      void _onConnect(connectionInfo).then(() => {
        setIsConnectionFormOpen(false);
      });
    },
    [_onConnect]
  );

  const onSaveNewConnection = useCallback(
    async (connectionInfo: ConnectionInfo) => {
      await saveConnection(connectionInfo);
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
      createDuplicateConnection(info);
      setIsConnectionFormOpen(true);
    },
    [setIsConnectionFormOpen, createDuplicateConnection]
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

  const onOpenCsfleModal = useCallback((connectionId: string) => {
    setCsfleModalConnectionId(connectionId);
  }, []);

  const onCloseCsfleModal = useCallback(() => {
    setCsfleModalConnectionId(undefined);
  }, []);

  const onCsfleChanged = useCallback(
    (isEnabled: boolean) => {
      if (csfleModalConnectionId) {
        onConnectionCsfleModeChanged(csfleModalConnectionId, isEnabled);
      }
    },
    [csfleModalConnectionId, onConnectionCsfleModeChanged]
  );

  const onOpenNonGenuineMongoDBModal = useCallback(() => {
    setGenuineMongoDBModalVisible(true);
  }, []);

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
        <Navigation currentLocation={activeWorkspace?.type ?? null} />
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
          onOpenCsfleModal={onOpenCsfleModal}
          onOpenNonGenuineMongoDBModal={onOpenNonGenuineMongoDBModal}
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
        <NonGenuineWarningModal
          isVisible={genuineMongoDBModalVisible}
          toggleIsVisible={setGenuineMongoDBModalVisible}
        />
        <MappedCsfleModal
          connectionId={csfleModalConnectionId}
          onClose={onCloseCsfleModal}
          setConnectionIsCSFLEEnabled={onCsfleChanged}
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
  onConnectionCsfleModeChanged: setConnectionIsCSFLEEnabled,
})(MultipleConnectionSidebar);

export default MappedMultipleConnectionSidebar;
