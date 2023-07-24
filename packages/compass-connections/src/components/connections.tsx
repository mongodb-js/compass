import React, { useCallback, useEffect, useState } from 'react';
import {
  ImportConnectionsModal,
  ExportConnectionsModal,
} from '@mongodb-js/compass-connection-import-export';
import {
  ResizableSidebar,
  ErrorBoundary,
  spacing,
  css,
  openToast,
  Link,
} from '@mongodb-js/compass-components';
import ConnectionForm from '@mongodb-js/connection-form';
import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';
import type { ConnectionInfo } from '@mongodb-js/connection-storage';
import { ConnectionStorage } from '@mongodb-js/connection-storage';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type AppRegistry from 'hadron-app-registry';

import FormHelp from './form-help/form-help';
import Connecting from './connecting/connecting';
import { useConnections } from '../stores/connections-store';
import { cloneDeep } from 'lodash';
import ConnectionList from './connection-list/connection-list';
import { getStoragePaths } from '@mongodb-js/compass-utils';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:connections:connections'
);

const { basepath } = getStoragePaths() ?? {};

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

const toastListStyle = css({
  listStyle: 'inherit',
  paddingLeft: spacing[1] + spacing[2],
});

const MigrateLegacyConnectionDescription = () => (
  <>
    Compass has identified connections created with an older version, which are
    no longer supported by the current version. To migrate these connections,
    follow the steps below:
    <ul className={toastListStyle}>
      <li>
        Install Compass{' '}
        <Link
          target="_blank"
          hideExternalIcon
          href="https://github.com/mongodb-js/compass/releases/tag/v1.39.0"
        >
          v1.39.0
        </Link>{' '}
        and{' '}
        <Link
          target="_blank"
          hideExternalIcon
          href="https://www.mongodb.com/docs/compass/current/connect/favorite-connections/import-export-ui/export/"
        >
          export all the connections
        </Link>
        .
      </li>
      <li>
        Update Compass to the latest version and{' '}
        <Link
          target="_blank"
          hideExternalIcon
          href="https://www.mongodb.com/docs/compass/current/connect/favorite-connections/import-export-ui/import/"
        >
          import the connections
        </Link>{' '}
        exported.
      </li>
    </ul>
  </>
);

function Connections({
  appRegistry,
  onConnected,
  isConnected,
  connectionStorage = new ConnectionStorage(basepath),
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

  useEffect(() => {
    if (state.hasLegacyConnections) {
      openToast('legacy-connections', {
        title: 'Legacy connections detected',
        description: <MigrateLegacyConnectionDescription />,
      });
    }
  }, [state.hasLegacyConnections]);

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
