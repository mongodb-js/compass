import { v4 as uuidv4 } from 'uuid';
import { ConnectionInfo } from 'mongodb-data-service';
import { ConnectionAttempt } from '../modules/connection-attempt';

export function createNewConnectionInfo(): ConnectionInfo {
  return {
    id: uuidv4(),
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };
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
      connectionId: string;
      connectionInfo: ConnectionInfo;
    }
  | {
      type: 'set-connections';
      connections: ConnectionInfo[];
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
    case 'set-connections':
      return {
        ...state,
        connections: action.connections,
      };
    default:
      return state;
  }
}
