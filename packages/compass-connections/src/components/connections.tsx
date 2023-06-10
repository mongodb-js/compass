import React, { useCallback, useState } from 'react';
import {
  ImportConnectionsModal,
  ExportConnectionsModal,
} from '@mongodb-js/compass-connection-import-export';
import {
  ResizableSidebar,
  ErrorBoundary,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import ConnectionForm from '@mongodb-js/connection-form';
import type { ConnectionInfo, DataService } from 'mongodb-data-service';
import { ConnectionStorage, connect } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type AppRegistry from 'hadron-app-registry';

import FormHelp from './form-help/form-help';
import Connecting from './connecting/connecting';
import { useConnections } from '../stores/connections-store';
import { cloneDeep } from 'lodash';
import ConnectionList from './connection-list/connection-list';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:connections:connections'
);

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

function Connections({
  appRegistry,
  onConnected,
  isConnected,
  connectionStorage = new ConnectionStorage(),
  appName,
  getAutoConnectInfo,
  connectFn = connect,
}: {
  appRegistry: AppRegistry;
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  isConnected: boolean;
  connectionStorage?: ConnectionStorage;
  appName: string;
  getAutoConnectInfo?: () => Promise<ConnectionInfo | undefined>;
  connectFn?: ConnectFn;
}): React.ReactElement {
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
    isConnected,
    connectionStorage,
    connectFn,
    appName,
    getAutoConnectInfo,
  });
  const {
    activeConnectionId,
    activeConnectionInfo,
    connectionAttempt,
    connectionErrorMessage,
    connectingStatusText,
    oidcDeviceAuthVerificationUrl,
    oidcDeviceAuthUserCode,
  } = state;

  const [showExportConnectionsModal, setShowExportConnectionsModal] =
    useState(false);
  const [showImportConnectionsModal, setShowImportConnectionsModal] =
    useState(false);

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
            />
          </ErrorBoundary>
          <FormHelp />
        </div>
      </div>
      {!!connectionAttempt && !connectionAttempt.isClosed() && (
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
      />
      <ExportConnectionsModal
        open={showExportConnectionsModal}
        setOpen={setShowExportConnectionsModal}
        favoriteConnections={favoriteConnections}
        trackingProps={{ context: 'connectionsList' }}
      />
    </div>
  );
}

export default Connections;
