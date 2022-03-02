import React from 'react';
import {
  ErrorBoundary,
  compassUIColors,
  spacing,
  css,
} from '@mongodb-js/compass-components';
import ConnectionForm from '@mongodb-js/connection-form';
import type {
  ConnectionInfo,
  ConnectionOptions,
  DataService,
} from 'mongodb-data-service';
import { ConnectionStorage, connect } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

import ResizableSidebar from './resizeable-sidebar';
import FormHelp from './form-help/form-help';
import Connecting from './connecting/connecting';
import type { ConnectionStore } from '../stores/connections-store';
import { useConnections } from '../stores/connections-store';
import { cloneDeep } from 'lodash';

const { debug } = createLoggerAndTelemetry(
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
  background: compassUIColors.gray8,
});

const connectItemContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  flexDirection: 'column',
  overflow: 'auto',
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
  connectionStorage?: ConnectionStore;
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
  } = useConnections({ onConnected, connectionStorage, connectFn, appName });
  const {
    activeConnectionId,
    activeConnectionInfo,
    connectionAttempt,
    connectionErrorMessage,
    connectingStatusText,
    connections,
    isConnected,
  } = state;

  return (
    <div
      data-testid={
        isConnected ? 'connections-connected' : 'connections-disconnected'
      }
      className={connectStyles}
    >
      <ResizableSidebar
        activeConnectionId={activeConnectionId}
        connections={connections}
        createNewConnection={createNewConnection}
        setActiveConnectionId={setActiveConnectionById}
        onConnectionDoubleClicked={connect}
        removeAllRecentsConnections={removeAllRecentsConnections}
        removeConnection={removeConnection}
        duplicateConnection={duplicateConnection}
      />
      <div className={connectItemContainerStyles}>
        <div className={formContainerStyles}>
          <ErrorBoundary
            onError={(error: Error, errorInfo: React.ErrorInfo) => {
              debug('error rendering connect form', error, errorInfo);
            }}
          >
            <ConnectionForm
              onConnectClicked={(connectionInfo) =>
                connect({
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
