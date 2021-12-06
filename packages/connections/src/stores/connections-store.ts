import { v4 as uuidv4 } from 'uuid';
import {
  ConnectionInfo,
  ConnectionOptions,
  DataService,
  getConnectionTitle,
} from 'mongodb-data-service';
import { useEffect, useReducer, useRef } from 'react';
import debugModule from 'debug';

import {
  createConnectionAttempt,
  ConnectionAttempt,
} from '../modules/connection-attempt';
import {
  trackConnectionAttemptEvent,
  trackNewConnectionEvent,
  trackConnectionFailedEvent,
} from '../modules/telemetry';
import {
  FormValidationError,
  FormValidationWarning,
  validateConnectionInfoErrors,
} from '../utils/validation';
const debug = debugModule('mongodb-compass:connections:connections-store');

export function createNewConnectionInfo(): ConnectionInfo {
  return {
    id: uuidv4(),
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
}

export interface ConnectionStore {
  loadAll: () => Promise<ConnectionInfo[]>;
  save: (connectionInfo: ConnectionInfo) => Promise<void>;
}

type State = {
  activeConnectionId?: string;
  activeConnectionInfo: ConnectionInfo;
  connectingStatusText: string;
  connectionAttempt: ConnectionAttempt | null;
  connectionErrorMessage: string | null;
  connections: ConnectionInfo[];
  isConnected: boolean;
  storeConnectionError: string | null;
  formErrors: FormValidationError[];
  formWarnings: FormValidationWarning[];
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
    storeConnectionError: null,
    formErrors: [],
    formWarnings: [],
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
      connectionId: string;
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'store-connection-error';
      errorMessage: string;
    }
  | {
      type: 'hide-store-connection-error';
    }
  | {
      type: 'set-connections';
      connections: ConnectionInfo[];
    }
  | { type: 'set-form-errors'; errors: FormValidationError[] }
  | { type: 'set-form-warnings'; warnings: FormValidationWarning[] };

export function connectionsReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'attempt-connect':
      return {
        ...state,
        connectionAttempt: action.connectionAttempt,
        connectingStatusText: action.connectingStatusText,
        connectionErrorMessage: null,
        storeConnectionError: null,
      };
    case 'cancel-connection-attempt':
      return {
        ...state,
        connectionAttempt: null,
        connectionErrorMessage: 'Connection attempt canceled.',
      };
    case 'connection-attempt-succeeded':
      return {
        ...state,
        connectionAttempt: null,
        isConnected: true,
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
        activeConnectionId: action.connectionId,
        activeConnectionInfo: action.connectionInfo,
      };
    case 'new-connection':
      return {
        ...state,
        activeConnectionId: action.connectionInfo.id,
        activeConnectionInfo: action.connectionInfo,
      };
    case 'store-connection-error':
      return {
        ...state,
        storeConnectionError: action.errorMessage,
      };
    case 'hide-store-connection-error':
      return {
        ...state,
        storeConnectionError: null,
      };
    case 'set-connections':
      return {
        ...state,
        connections: action.connections,
      };
    case 'set-form-errors':
      return {
        ...state,
        formErrors: action.errors,
      };

    case 'set-form-warnings':
      return {
        ...state,
        formWarnings: action.warnings,
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
  connectionStorage: ConnectionStore
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

export function useConnections(
  onConnected: (
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) => Promise<void>,
  connectionStorage: ConnectionStore,
  connectFn: (connectionOptions: ConnectionOptions) => Promise<DataService>
): [
  State,
  {
    cancelConnectionAttempt(): void;
    connect(connectionInfo: ConnectionInfo): Promise<void>;
    createNewConnection(): void;
    hideStoreConnectionError(): void;
    setActiveConnectionById(newConnectionId?: string | undefined): void;
  }
] {
  const [state, dispatch]: [State, React.Dispatch<Action>] = useReducer(
    connectionsReducer,
    defaultConnectionsState()
  );
  const { isConnected, connectionAttempt, connections } = state;

  const connectingConnectionAttempt = useRef<ConnectionAttempt>();
  const connectedConnectionInfo = useRef<ConnectionInfo>();
  const connectedDataService = useRef<DataService>();

  async function saveConnectionInfo(connectionInfo: ConnectionInfo) {
    try {
      await connectionStorage.save(connectionInfo);

      debug(`saved connection with id ${connectionInfo.id || ''}`);
    } catch (err) {
      debug(
        `error saving connection with id ${connectionInfo.id || ''}: ${
          (err as Error).message
        }`
      );

      dispatch({
        type: 'store-connection-error',
        errorMessage: (err as Error).message,
      });
    }
  }

  async function onConnectSuccess(
    connectionInfo: ConnectionInfo,
    dataService: DataService
  ) {
    // After connecting and the UI is updated we notify the rest of Compass.
    try {
      await onConnected(connectionInfo, dataService);
    } catch (err) {
      debug(
        `error occurred connection with id ${connectionInfo.id || ''}: ${
          (err as Error).message
        }`
      );

      dispatch({
        type: 'store-connection-error',
        errorMessage: `Error handling connection success: ${
          (err as Error).message
        }`,
      });
    }
  }

  useEffect(() => {
    if (
      isConnected &&
      connectedConnectionInfo.current &&
      connectedDataService.current
    ) {
      // Update lastUsed date as now and save the connection.
      connectedConnectionInfo.current.lastUsed = new Date();
      void saveConnectionInfo(connectedConnectionInfo.current);

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

  return [
    state,
    {
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
        const errors = validateConnectionInfoErrors(connectionInfo);
        if (errors.length) {
          dispatch({
            type: 'set-form-errors',
            errors,
          });
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
          const newConnectionDataService = await newConnectionAttempt.connect(
            connectionInfo.connectionOptions
          );
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
          trackConnectionFailedEvent(connectionInfo, error);
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
      hideStoreConnectionError() {
        dispatch({
          type: 'hide-store-connection-error',
        });
      },
      setActiveConnectionById(newConnectionId: string) {
        const connection = connections.find(
          (connection) => connection.id === newConnectionId
        );
        if (connection) {
          dispatch({
            type: 'set-active-connection',
            connectionId: newConnectionId,
            connectionInfo: connection,
          });
        }
      },
    },
  ];
}
