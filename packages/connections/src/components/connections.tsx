import { css } from '@emotion/css';
import React, { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  MongoDBLogo,
  breakpoints,
  compassUIColors,
  spacing,
} from '@mongodb-js/compass-components';
import ConnectForm from '@mongodb-js/connect-form';
import {
  ConnectionInfo,
  ConnectionStorage,
  DataService,
  convertConnectionInfoToModel,
  getConnectionTitle,
} from 'mongodb-data-service';
import debugModule from 'debug';
import AppRegistry from 'hadron-app-registry';

import ResizableSidebar from './resizeable-sidebar';
import FormHelp from './form-help/form-help';
import { createConnectionAttempt } from '../modules/connection-attempt';
import Connecting from './connecting/connecting';
import {
  connectionsReducer,
  createNewConnectionInfo,
  defaultConnectionsState,
} from '../stores/connections-store';

const debug = debugModule('mongodb-compass:connections:connections');

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

const logoStyles = css({
  margin: spacing[5],
  marginBottom: 0,
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
  flexDirection: 'column',
  padding: 0,
  paddingBottom: spacing[4],
  [`@media only screen and (min-width: ${breakpoints.Desktop}px)`]: {
    flexDirection: 'row',
  },
});

function Connections({
  appRegistry,
}: {
  appRegistry: AppRegistry;
}): React.ReactElement {
  const [
    {
      activeConnectionId,
      activeConnectionInfo,
      connectingStatusText,
      connectionAttempt,
      connections,
      isConnected,
    },
    dispatch,
  ] = useReducer(connectionsReducer, defaultConnectionsState());

  const connectedConnectionInfo = useRef<ConnectionInfo>();
  const connectedDataService = useRef<DataService>();

  const updateActiveConnection = (newConnectionId?: string | undefined) => {
    if (newConnectionId) {
      const connection = connections.find(
        (connection) => connection.id === newConnectionId
      );
      if (connection) {
        dispatch({
          type: 'set-active-connection',
          connectionId: newConnectionId,
          connectionInfo: connection,
        });
        return;
      }
    }

    dispatch({
      type: 'new-connection',
      connectionInfo: createNewConnectionInfo(),
    });
  };

  function onConnectSuccess(
    dataService: DataService,
    connectionInfo: ConnectionInfo
  ) {
    connectedConnectionInfo.current = connectionInfo;
    connectedDataService.current = dataService;

    dispatch({
      type: 'connection-attempt-succeeded',
    });
    debug('connection attempt succeeded with connection info', connectionInfo);

    // TODO: Update and save connection lastUsed date.
  }

  async function onConnect(connectionInfo: ConnectionInfo) {
    if (connectionAttempt || isConnected) {
      // Ensure we aren't currently connecting.
      return;
    }

    const newConnectionAttempt = createConnectionAttempt();

    dispatch({
      type: 'attempt-connect',
      connectingStatusText: `Connecting to ${getConnectionTitle(
        connectionInfo
      )}`,
      connectionAttempt: newConnectionAttempt,
    });

    debug('connecting with connectionInfo', connectionInfo);

    try {
      const connectedDataService = await newConnectionAttempt.connect(
        connectionInfo.connectionOptions
      );

      if (!connectedDataService || newConnectionAttempt.isClosed()) {
        // The connection attempt was cancelled.
        return;
      }

      onConnectSuccess(connectedDataService, connectionInfo);
    } catch (error) {
      debug('connect error', error);

      dispatch({
        type: 'connection-attempt-errored',
        connectionErrorMessage: error.message,
      });
    }
  }

  const cancelAnyCurrentConnectionAttempt = useCallback(() => {
    if (!isConnected) {
      connectionAttempt?.cancelConnectionAttempt();
    }
  }, [connectionAttempt, isConnected]);

  async function loadConnections() {
    try {
      const connectionStorage = new ConnectionStorage();
      const loadedConnections = await connectionStorage.loadAll();

      dispatch({
        type: 'set-connections',
        connections: loadedConnections,
      });
    } catch (error) {
      debug('error loading connections', error);
      // TODO: Create an error state for when loading connections fails (and a retry).
    }
  }

  async function notifyCompassOfConnectionSuccess() {
    // TODO: Remove this once we remove the dependency in compass-sidebar.
    const legacyConnectionModel = await convertConnectionInfoToModel(
      connectedConnectionInfo.current
    );

    appRegistry.emit(
      'data-service-connected',
      null, // No error connecting.
      connectedDataService.current,
      connectedConnectionInfo.current,
      legacyConnectionModel // TODO: Remove this once we remove the dependency in compass-sidebar.
    );
  }

  useEffect(() => {
    if (isConnected) {
      // After connecting and the UI is updated we notify the rest of Compass.
      void notifyCompassOfConnectionSuccess();
    }
  }, [isConnected]);

  useEffect(() => {
    // Load connections after first render.
    void loadConnections();

    return () => {
      // On unmount if we're currently connecting, cancel the attempt.
      cancelAnyCurrentConnectionAttempt();
    };
  }, []);

  return (
    <div
      data-testid={
        isConnected ? 'connections-connected' : 'connections-disconneced'
      }
      className={connectStyles}
    >
      <ResizableSidebar
        activeConnectionId={activeConnectionId}
        connections={connections}
        setActiveConnectionId={updateActiveConnection}
      />
      <div className={connectItemContainerStyles}>
        <MongoDBLogo className={logoStyles} color={'green-dark-2'} />
        <div className={formContainerStyles}>
          <ConnectForm
            // TODO: Add connectionErrorMessage and isConnected handling.
            onConnectClicked={(connectionInfo) => onConnect(connectionInfo)}
            initialConnectionInfo={activeConnectionInfo}
            key={activeConnectionId}
          />
          <FormHelp />
        </div>
      </div>
      <Connecting
        connectionAttempt={connectionAttempt}
        connectingStatusText={connectingStatusText}
        onCancelConnectionClicked={() =>
          dispatch({
            type: 'cancel-connection-attempt',
          })
        }
      />
    </div>
  );
}

export default Connections;
