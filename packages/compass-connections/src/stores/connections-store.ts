import type {
  ConnectionInfo,
  ConnectionOptions,
  DataService,
  ConnectionStorage,
} from 'mongodb-data-service';
import { getConnectionTitle } from 'mongodb-data-service';
import { useEffect, useReducer, useRef } from 'react';
import debugModule from 'debug';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

import type { ConnectionAttempt } from '../modules/connection-attempt';
import { createConnectionAttempt } from '../modules/connection-attempt';
import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from '../modules/telemetry';
import ConnectionString from 'mongodb-connection-string-url';
import type { MongoClientOptions } from 'mongodb';

import { ToastVariant, useToast } from '@mongodb-js/compass-components';
const debug = debugModule('mongodb-compass:connections:connections-store');

export function createNewConnectionInfo(): ConnectionInfo {
  return {
    id: uuidv4(),
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

function ensureWellFormedConnectionString(connectionString: string) {
  new ConnectionString(
    connectionString,

    { looseValidation: true }
  );
}

function setAppNameParamIfMissing(
  connectionString: string,
  appName: string
): string {
  let connectionStringUrl;

  try {
    connectionStringUrl = new ConnectionString(connectionString, {
      looseValidation: true,
    });
  } catch (e) {
    //
  }

  if (!connectionStringUrl) {
    return connectionString;
  }

  const searchParams =
    connectionStringUrl.typedSearchParams<MongoClientOptions>();
  if (!searchParams.has('appName')) {
    searchParams.set('appName', appName);
  }

  return connectionStringUrl.href;
}

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
  connectingStatusText: string;
  connectionAttempt: ConnectionAttempt | null;
  connectionErrorMessage: string | null;
  connections: ConnectionInfo[];
  isConnected: boolean;
};

export function defaultConnectionsState(): State {
  return {
    activeConnectionId: undefined,
    activeConnectionInfo: createNewConnectionInfo(),
    connectingStatusText: '',
    connections: [],
    connectionAttempt: null,
    connectionErrorMessage: null,
    isConnected: false,
  };
}

type Action =
  | {
      type: 'attempt-connect';
      connectionAttempt: ConnectionAttempt;
      connectingStatusText: string;
    }
  | {
      type: 'cancel-connection-attempt';
    }
  | {
      type: 'connection-attempt-errored';
      connectionErrorMessage: string;
    }
  | {
      type: 'connection-attempt-succeeded';
    }
  | {
      type: 'new-connection';
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'set-active-connection';
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'set-connections';
      connections: ConnectionInfo[];
    }
  | {
      type: 'set-connections-and-select';
      connections: ConnectionInfo[];
      activeConnectionInfo: ConnectionInfo;
    };

export function connectionsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'attempt-connect':
      return {
        ...state,
        connectionAttempt: action.connectionAttempt,
        connectingStatusText: action.connectingStatusText,
        connectionErrorMessage: null,
      };
    case 'cancel-connection-attempt':
      return {
        ...state,
        connectionAttempt: null,
        connectionErrorMessage: null,
      };
    case 'connection-attempt-succeeded':
      return {
        ...state,
        connectionAttempt: null,
        isConnected: true,
        connectionErrorMessage: null,
      };
    case 'connection-attempt-errored':
      return {
        ...state,
        connectionAttempt: null,
        connectionErrorMessage: action.connectionErrorMessage,
      };
    case 'set-active-connection':
      return {
        ...state,
        activeConnectionId: action.connectionInfo.id,
        activeConnectionInfo: action.connectionInfo,
        connectionErrorMessage: null,
      };
    case 'new-connection':
      return {
        ...state,
        activeConnectionId: action.connectionInfo.id,
        activeConnectionInfo: action.connectionInfo,
        connectionErrorMessage: null,
      };
    case 'set-connections':
      return {
        ...state,
        connections: action.connections,
        connectionErrorMessage: null,
      };
    case 'set-connections-and-select':
      return {
        ...state,
        connections: action.connections,
        activeConnectionId: action.activeConnectionInfo.id,
        activeConnectionInfo: action.activeConnectionInfo,
        connectionErrorMessage: null,
      };
    default:
      return state;
  }
}

async function loadConnections(
  dispatch: React.Dispatch<{
    type: 'set-connections';
    connections: ConnectionInfo[];
  }>,
  connectionStorage: ConnectionStorage
) {
  try {
    const loadedConnections = await connectionStorage.loadAll();

    dispatch({
      type: 'set-connections',
      connections: loadedConnections,
    });
  } catch (error) {
    debug('error loading connections', error);
  }
}

export function useConnections({
  onConnected,
  connectionStorage,
  appName,
  connectFn,
}: {
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => void;
  connectionStorage: ConnectionStorage;
  connectFn: (connectionOptions: ConnectionOptions) => Promise<DataService>;
  appName: string;
}): {
  state: State;
  cancelConnectionAttempt: () => void;
  connect: (connectionInfo: ConnectionInfo) => Promise<void>;
  createNewConnection: () => void;
  saveConnection: (connectionInfo: ConnectionInfo) => Promise<void>;
  setActiveConnectionById: (newConnectionId: string) => void;
  removeAllRecentsConnections: () => Promise<void>;
  duplicateConnection: (connectioInfo: ConnectionInfo) => void;
  removeConnection: (connectionInfo: ConnectionInfo) => void;
} {
  const { openToast } = useToast('compass-connections');

  const [state, dispatch]: [State, React.Dispatch<Action>] = useReducer(
    connectionsReducer,
    defaultConnectionsState()
  );
  const { activeConnectionId, isConnected, connectionAttempt, connections } =
    state;

  const connectingConnectionAttempt = useRef<ConnectionAttempt>();
  const connectedConnectionInfo = useRef<ConnectionInfo>();
  const connectedDataService = useRef<DataService>();

  async function saveConnectionInfo(
    connectionInfo: ConnectionInfo
  ): Promise<boolean> {
    try {
      ensureWellFormedConnectionString(
        connectionInfo?.connectionOptions?.connectionString
      );
      await connectionStorage.save(connectionInfo);
      debug(`saved connection with id ${connectionInfo.id || ''}`);

      return true;
    } catch (err) {
      debug(
        `error saving connection with id ${connectionInfo.id || ''}: ${
          (err as Error).message
        }`
      );

      openToast('save-connection-error', {
        title: 'Error',
        variant: ToastVariant.Warning,
        body: `An error occurred while saving the connection. ${
          (err as Error).message
        }`,
      });

      return false;
    }
  }

  async function onConnectSuccess(
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) {
    // After connecting and the UI is updated we notify the rest of Compass.
    try {
      onConnected(connectionInfo, dataService);

      // if a connection has been saved already we only want to update the lastUsed
      // attribute, otherwise we are going to save the entire connection info.
      const connectionInfoToBeSaved =
        (await connectionStorage.load(connectionInfo.id)) ?? connectionInfo;

      await saveConnectionInfo({
        ...cloneDeep(connectionInfoToBeSaved),
        lastUsed: new Date(),
      });
    } catch (err) {
      debug(
        `error occurred connection with id ${connectionInfo.id || ''}: ${
          (err as Error).message
        }`
      );
    }
  }

  useEffect(() => {
    if (
      isConnected &&
      connectedConnectionInfo.current &&
      connectedDataService.current
    ) {
      void onConnectSuccess(
        connectedConnectionInfo.current,
        connectedDataService.current
      );
    }
  }, [isConnected, onConnected]);

  useEffect(() => {
    // Load connections after first render.
    void loadConnections(dispatch, connectionStorage);

    return () => {
      // When unmounting, clean up any current connection attempts that have
      // not resolved.
      if (
        connectingConnectionAttempt.current &&
        !connectingConnectionAttempt.current.isClosed()
      ) {
        connectingConnectionAttempt.current.cancelConnectionAttempt();
      }
    };
  }, []);

  return {
    state,
    cancelConnectionAttempt() {
      connectionAttempt?.cancelConnectionAttempt();

      dispatch({
        type: 'cancel-connection-attempt',
      });
    },
    async connect(connectionInfo: ConnectionInfo) {
      if (connectionAttempt || isConnected) {
        // Ensure we aren't currently connecting.
        return;
      }

      const newConnectionAttempt = createConnectionAttempt(connectFn);
      connectingConnectionAttempt.current = newConnectionAttempt;

      dispatch({
        type: 'attempt-connect',
        connectingStatusText: `Connecting to ${getConnectionTitle(
          connectionInfo
        )}`,
        connectionAttempt: newConnectionAttempt,
      });

      trackConnectionAttemptEvent(connectionInfo);
      debug('connecting with connectionInfo', connectionInfo);

      try {
        const connectionStringWithAppName = setAppNameParamIfMissing(
          connectionInfo.connectionOptions.connectionString,
          appName
        );
        const newConnectionDataService = await newConnectionAttempt.connect({
          ...cloneDeep(connectionInfo.connectionOptions),
          connectionString: connectionStringWithAppName,
        });
        connectingConnectionAttempt.current = undefined;

        if (!newConnectionDataService || newConnectionAttempt.isClosed()) {
          // The connection attempt was cancelled.
          return;
        }

        // Successfully connected.
        connectedConnectionInfo.current = connectionInfo;
        connectedDataService.current = newConnectionDataService;

        dispatch({
          type: 'connection-attempt-succeeded',
        });
        trackNewConnectionEvent(connectionInfo, newConnectionDataService);
        debug(
          'connection attempt succeeded with connection info',
          connectionInfo
        );
      } catch (error) {
        connectingConnectionAttempt.current = undefined;
        trackConnectionFailedEvent(connectionInfo, error as Error);
        debug('connect error', error);

        dispatch({
          type: 'connection-attempt-errored',
          connectionErrorMessage: (error as Error).message,
        });
      }
    },
    createNewConnection() {
      dispatch({
        type: 'new-connection',
        connectionInfo: createNewConnectionInfo(),
      });
    },
    async saveConnection(connectionInfo: ConnectionInfo) {
      const saved = await saveConnectionInfo(connectionInfo);

      if (!saved) {
        return;
      }

      const existingConnectionIndex = connections.findIndex(
        (connection) => connection.id === connectionInfo.id
      );

      const newConnections = [...connections];

      if (existingConnectionIndex !== -1) {
        // Update the existing saved connection.
        newConnections[existingConnectionIndex] = cloneDeep(connectionInfo);
      } else {
        // Add the newly saved connection to our connections list.
        newConnections.push(cloneDeep(connectionInfo));
      }

      if (activeConnectionId === connectionInfo.id) {
        // Update the active connection if it's currently selected.
        dispatch({
          type: 'set-connections-and-select',
          connections: newConnections,
          activeConnectionInfo: cloneDeep(connectionInfo),
        });
        return;
      }

      dispatch({
        type: 'set-connections',
        connections: newConnections,
      });
    },
    setActiveConnectionById(newConnectionId: string) {
      const connection = connections.find(
        (connection) => connection.id === newConnectionId
      );
      if (connection) {
        dispatch({
          type: 'set-active-connection',
          connectionInfo: connection,
        });
      }
    },
    async removeConnection(connectionInfo: ConnectionInfo) {
      await connectionStorage.delete(connectionInfo);
      dispatch({
        type: 'set-connections',
        connections: connections.filter(
          (conn) => conn.id !== connectionInfo.id
        ),
      });
      if (activeConnectionId === connectionInfo.id) {
        const nextActiveConnection = createNewConnectionInfo();
        dispatch({
          type: 'set-active-connection',
          connectionInfo: nextActiveConnection,
        });
      }
    },
    async duplicateConnection(connectionInfo: ConnectionInfo) {
      const duplicate: ConnectionInfo = {
        ...cloneDeep(connectionInfo),
        id: uuidv4(),
      };
      duplicate.favorite!.name += ' (copy)';

      await saveConnectionInfo(duplicate);
      dispatch({
        type: 'set-connections-and-select',
        connections: [...connections, duplicate],
        activeConnectionInfo: duplicate,
      });
    },
    async removeAllRecentsConnections() {
      const recentConnections = connections.filter((conn) => {
        return !conn.favorite;
      });
      await Promise.all(
        recentConnections.map((conn) => connectionStorage.delete(conn))
      );
      dispatch({
        type: 'set-connections',
        connections: connections.filter((conn) => {
          return conn.favorite;
        }),
      });
    },
  };
}
