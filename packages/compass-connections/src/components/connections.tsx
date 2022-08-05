import React, { useState } from 'react';
import {
  ResizableSidebar,
  Theme,
  ThemeProvider,
  ErrorBoundary,
  WorkspaceContainer,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import type { ThemeState } from '@mongodb-js/compass-components';
import ConnectionForm from '@mongodb-js/connection-form';
import type {
  ConnectionInfo,
  ConnectionOptions,
  DataService,
} from 'mongodb-data-service';
import { ConnectionStorage, connect } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import FormHelp from './form-help/form-help';
import Connecting from './connecting/connecting';
import { useConnections } from '../stores/connections-store';
import { cloneDeep } from 'lodash';
import ConnectionList from './connection-list/connection-list';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'mongodb-compass:connections:connections'
);

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
});

function Connections({
  onConnected,
  connectionStorage = new ConnectionStorage(),
  appName,
  connectFn = connect,
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  connectionStorage?: ConnectionStorage;
  appName: string;
  connectFn?: (connectionOptions: ConnectionOptions) => Promise<DataService>;
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
  } = useConnections({ onConnected, connectionStorage, connectFn, appName });
  const {
    activeConnectionId,
    activeConnectionInfo,
    connectionAttempt,
    connectionErrorMessage,
    connectingStatusText,
    isConnected,
  } = state;

  // For now the connections sidebar is always dark
  const [theme] = useState<ThemeState>({
    theme: Theme.Dark,
  });

  return (
    <div
      data-testid={
        isConnected ? 'connections-connected' : 'connections-disconnected'
      }
      className={connectStyles}
    >
      <ThemeProvider theme={theme}>
        <ResizableSidebar>
          <ConnectionList
            activeConnectionId={activeConnectionId}
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
          />
        </ResizableSidebar>
      </ThemeProvider>
      <WorkspaceContainer>
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
      </WorkspaceContainer>
      {(isConnected ||
        (!!connectionAttempt && !connectionAttempt.isClosed())) && (
        <Connecting
          connectingStatusText={connectingStatusText}
          onCancelConnectionClicked={cancelConnectionAttempt}
        />
      )}
    </div>
  );
}

export default Connections;
