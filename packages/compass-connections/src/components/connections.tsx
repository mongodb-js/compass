import {
  Card,
  ErrorBoundary,
  ResizableSidebar,
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import {
  ExportConnectionsModal,
  ImportConnectionsModal,
} from '@mongodb-js/compass-connection-import-export';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import ConnectionForm from '@mongodb-js/connection-form';
import { type ConnectionInfo } from '@mongodb-js/connection-storage/renderer';
import { useConnectionStorageContext } from '@mongodb-js/connection-storage/provider';
import type AppRegistry from 'hadron-app-registry';
import type { connect } from 'mongodb-data-service';
import { useConnectionsManagerContext, ConnectionStatus } from '../provider';
import React, { useCallback, useMemo, useState } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import { cloneDeep } from 'lodash';
import { useConnections } from '../stores/connections-store';
import Connecting from './connecting/connecting';
import ConnectionList from './connection-list/connection-list';
import FormHelp from './form-help/form-help';
import { LegacyConnectionsModal } from './legacy-connections-modal';

type ConnectFn = typeof connect;

export type { ConnectFn };

const connectStyles = css({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'row',
});

const formContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  display: 'flex',
  padding: spacing[4],
  margin: 0,
  paddingBottom: spacing[3],
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: spacing[4],
  overflow: 'auto',
  height: '100%',
});

const connectFormContainerStyles = css({
  margin: 0,
  padding: 0,
  height: 'fit-content',
  width: spacing[6] * 12,
  position: 'relative',
  display: 'inline-block',
});

const connectFormCardStyles = css({
  margin: 0,
  height: 'fit-content',
  width: '100%',
  position: 'relative',
  display: 'flex',
  flexFlow: 'column nowrap',
  maxHeight: '95vh',
});

const formCardDarkThemeStyles = css({
  background: palette.black,
});

const formCardLightThemeStyles = css({
  background: palette.white,
});

function Connections({
  appRegistry,
  onConnected,
  appName,
  getAutoConnectInfo,
}: {
  appRegistry: AppRegistry;
  onConnected: (connectionInfo: ConnectionInfo) => void;
  appName: string;
  getAutoConnectInfo?: () => Promise<ConnectionInfo | undefined>;
}): React.ReactElement {
  const { log, mongoLogId } = useLoggerAndTelemetry('COMPASS-CONNECTIONS');
  // TODO(COMPASS-7397): services should not be used directly in render method,
  // when this code is refactored to use the hadron plugin interface, storage
  // should be handled through the plugin activation lifecycle
  const connectionStorage = useConnectionStorageContext();
  const connectionsManager = useConnectionsManagerContext();

  const {
    state,
    cancelConnectionAttempt,
    connect,
    createNewConnection,
    duplicateConnection,
    setActiveConnectionById,
    removeAllRecentsConnections,
    removeConnection,
    saveConnection,
    favoriteConnections,
    recentConnections,
    reloadConnections,
  } = useConnections({
    onConnected,
    appName,
    getAutoConnectInfo,
  });
  const {
    activeConnectionId,
    activeConnectionInfo,
    connectionErrorMessage,
    connectingStatusText,
    oidcDeviceAuthVerificationUrl,
    oidcDeviceAuthUserCode,
  } = state;

  const [showExportConnectionsModal, setShowExportConnectionsModal] =
    useState(false);
  const [showImportConnectionsModal, setShowImportConnectionsModal] =
    useState(false);

  const darkMode = useDarkMode();

  const openConnectionImportExportModal = useCallback(
    (action: 'export-favorites' | 'import-favorites') => {
      if (action === 'export-favorites') {
        setShowExportConnectionsModal(true);
      } else {
        setShowImportConnectionsModal(true);
      }
    },
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
    <div data-testid="connections-wrapper" className={connectStyles}>
      <ResizableSidebar>
        <ConnectionList
          activeConnectionId={activeConnectionId}
          appRegistry={appRegistry}
          favoriteConnections={favoriteConnections}
          recentConnections={recentConnections}
          createNewConnection={createNewConnection}
          setActiveConnectionId={setActiveConnectionById}
          onDoubleClick={(connectionInfo) => {
            void connect(connectionInfo);
          }}
          removeAllRecentsConnections={() => {
            void removeAllRecentsConnections();
          }}
          removeConnection={removeConnection}
          duplicateConnection={duplicateConnection}
          openConnectionImportExportModal={openConnectionImportExportModal}
        />
      </ResizableSidebar>
      <div>
        <div className={formContainerStyles}>
          <ErrorBoundary
            onError={(error: Error, errorInfo: React.ErrorInfo) => {
              log.error(
                mongoLogId(1001000108),
                'Connect Form',
                'Rendering connect form failed',
                { error: error.message, errorInfo }
              );
            }}
          >
            <div
              className={connectFormContainerStyles}
              data-testid="connection-form"
            >
              <Card
                className={cx(
                  connectFormCardStyles,
                  darkMode ? formCardDarkThemeStyles : formCardLightThemeStyles
                )}
              >
                <ConnectionForm
                  onConnectClicked={(connectionInfo) =>
                    void connect({
                      ...cloneDeep(connectionInfo),
                    })
                  }
                  key={activeConnectionId}
                  onSaveConnectionClicked={saveConnection}
                  initialConnectionInfo={activeConnectionInfo}
                  connectionErrorMessage={connectionErrorMessage}
                  preferences={preferences}
                />
              </Card>
            </div>
          </ErrorBoundary>
          <FormHelp />
        </div>
      </div>
      {activeConnectionId &&
        connectionsManager.statusOf(activeConnectionId) ===
          ConnectionStatus.Connecting && (
          <Connecting
            oidcDeviceAuthVerificationUrl={oidcDeviceAuthVerificationUrl}
            oidcDeviceAuthUserCode={oidcDeviceAuthUserCode}
            connectingStatusText={connectingStatusText}
            onCancelConnectionClicked={cancelConnectionAttempt}
          />
        )}
      <ImportConnectionsModal
        open={showImportConnectionsModal}
        setOpen={setShowImportConnectionsModal}
        favoriteConnections={favoriteConnections}
        afterImport={reloadConnections}
        trackingProps={{ context: 'connectionsList' }}
        connectionStorage={connectionStorage}
      />
      <ExportConnectionsModal
        open={showExportConnectionsModal}
        setOpen={setShowExportConnectionsModal}
        favoriteConnections={favoriteConnections}
        trackingProps={{ context: 'connectionsList' }}
        connectionStorage={connectionStorage}
      />
      <LegacyConnectionsModal connectionStorage={connectionStorage} />
    </div>
  );
}

export default Connections;
