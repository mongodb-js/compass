import { css } from '@emotion/css';
import React, { useEffect, useReducer } from 'react';
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
} from 'mongodb-data-service';
import { v4 as uuidv4 } from 'uuid';

import ResizableSidebar from './resizeable-sidebar';
import FormHelp from './form-help/form-help';
import {
  ConnectionAttempt,
  createConnectionAttempt,
} from '../modules/connection-attempt';

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

function getDefaultConnectionInfo() {
  return {
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
  connectionAttempt: ConnectionAttempt | null;
  connections: ConnectionInfo[];
};

type Action =
  | {
      type: 'attempt-connect';
      connectionAttempt: ConnectionAttempt;
    }
  | {
      type: 'cancel-connection-attempt';
    }
  | {
      type: 'new-connection';
      newConnectionId: string;
    }
  | {
      type: 'set-active-connection';
      connectionId: string;
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'set-connections';
      connections: ConnectionInfo[];
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'attempt-connect':
      return {
        ...state,
        connectionAttempt: action.connectionAttempt,
      };
    case 'cancel-connection-attempt':
      state.connectionAttempt?.cancelConnectionAttempt();
      return {
        ...state,
        connectionAttempt: null,
      };
    case 'set-active-connection':
      return {
        ...state,
        activeConnectionId: action.connectionId,
        activeConnectionInfo: action.connectionInfo,
      };
    case 'new-connection':
      return {
        ...state,
        activeConnectionId: action.newConnectionId,
        activeConnectionInfo: {
          ...getDefaultConnectionInfo(),
          id: action.newConnectionId,
        },
      };
    case 'set-connections':
      return {
        ...state,
        connections: action.connections,
      };
    default:
      return state;
  }
}

function Connections(): React.ReactElement {
  const [
    {
      connectionAttempt,
      connections,
      activeConnectionId,
      activeConnectionInfo,
    },
    dispatch,
  ] = useReducer(reducer, {
    activeConnectionId: undefined,
    activeConnectionInfo: {
      ...getDefaultConnectionInfo(),
    },
    connections: [],
    connectionAttempt: null,
  });

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
      newConnectionId: uuidv4(),
    });
  };

  async function loadConnections() {
    try {
      const connectionStorage = new ConnectionStorage();
      const loadedConnections = await connectionStorage.loadAll();

      dispatch({
        type: 'set-connections',
        connections: loadedConnections,
      });
    } catch (e) {
      console.log('error', e);
      // TODO
    }
  }

  function onConnectSuccess(
    dataService: DataService,
    connectionInfo: ConnectionInfo
  ) {
    // TODO: Ensure we're still mounted here.
    // dispatch({
    //   type: 'connection-attempt-succeeded',
    //   connectionAttempt: newConnectionAttempt,
    // });
    console.log('connection attempt succeeded');

    // TODO: Update lastUsed

    // TODO: appRegistry get from context?
    (global as any).hadronApp.appRegistry.emit(
      'data-service-connected',
      null, // No error connecting.
      dataService,
      connectionInfo
      // connectionModel // TODO: remove
    );

    // global.hadronApp
  }

  async function onConnect(connectionInfo: ConnectionInfo) {
    // TODO: Maybe ensure we aren't current connecting.
    const newConnectionAttempt = createConnectionAttempt();

    dispatch({
      type: 'attempt-connect',
      connectionAttempt: newConnectionAttempt,
    });

    // debug('connecting with connectionInfo', connectionInfo);

    console.log('connecting with connectionInfo', connectionInfo);
    try {
      const connectedDataService = await newConnectionAttempt.connect(
        connectionInfo.connectionOptions
      );

      if (!connectedDataService || !connectionAttempt) {
        // TODO: Improve this check? connectionAttempt.is closed
        console.log('here');
        return;
      }

      onConnectSuccess(connectedDataService, connectionInfo);
    } catch (error) {
      // debug('_connect error', error);
      console.log('connect error', error);
      // this.setState({
      //   isValid: false,
      //   errorMessage: error.message,
      //   syntaxErrorMessage: null
      // });
    }
  }

  useEffect(() => {
    void loadConnections();

    return () => {
      // Cancel any active connection attempt on unmount.
      connectionAttempt?.cancelConnectionAttempt();
    };
  }, []);

  return (
    <div className={connectStyles}>
      <ResizableSidebar
        activeConnectionId={activeConnectionId}
        connections={connections}
        setActiveConnectionId={updateActiveConnection}
      />
      <div className={connectItemContainerStyles}>
        <MongoDBLogo className={logoStyles} color={'green-dark-2'} />
        <div className={formContainerStyles}>
          <ConnectForm
            onConnectClicked={(connectionInfo) => onConnect(connectionInfo)}
            initialConnectionInfo={activeConnectionInfo}
            key={activeConnectionId}
          />
          <FormHelp />
        </div>
      </div>
    </div>
  );
}

export default Connections;
