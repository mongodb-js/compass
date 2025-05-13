import type { AnyAction, Reducer } from 'redux';
import type { MCPStoreThunkAction } from './reducer';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type ConnectionState = {
  selectedConnectionId: string | null;
  isConnecting: boolean;
  connectionError: Error | null;
};

const INITIAL_STATE: ConnectionState = {
  selectedConnectionId: null,
  isConnecting: false,
  connectionError: null,
};

export enum ConnectionStateActions {
  ConnectionSelected = 'compass-mcp/connections/ConnectionSelected',
  ConnectionEstablished = 'compass-mcp/connections/ConnectionEstablished',
  ConnectionFailed = 'compass-mcp/connections/ConnectionFailed',
}

type ConnectionSelectedAction = {
  type: ConnectionStateActions.ConnectionSelected;
  selectedConnectionId: string;
};

type ConnectionEstablishedAction = {
  type: ConnectionStateActions.ConnectionEstablished;
};

type ConnectionFailedAction = {
  type: ConnectionStateActions.ConnectionFailed;
  error: Error;
};

export const connectionsReducer: Reducer<ConnectionState> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<ConnectionSelectedAction>(
      action,
      ConnectionStateActions.ConnectionSelected
    )
  ) {
    return {
      isConnecting: true,
      selectedConnectionId: action.selectedConnectionId,
      connectionError: null,
    };
  }
  if (
    isAction<ConnectionEstablishedAction>(
      action,
      ConnectionStateActions.ConnectionEstablished
    )
  ) {
    return {
      ...state,
      isConnecting: false,
      connectionError: null,
    };
  }
  if (
    isAction<ConnectionFailedAction>(
      action,
      ConnectionStateActions.ConnectionFailed
    )
  ) {
    return {
      ...state,
      isConnecting: false,
      connectionError: action.error,
    };
  }
  return state;
};

export function connectionSelected(
  connId: string
): MCPStoreThunkAction<
  Promise<void>,
  | ConnectionSelectedAction
  | ConnectionEstablishedAction
  | ConnectionFailedAction
> {
  return async (dispatch, _, { mcpService, connections, preferences }) => {
    dispatch({
      type: ConnectionStateActions.ConnectionSelected,
      selectedConnectionId: connId,
    });

    try {
      const telemetry = preferences.getPreferences().trackUsageStatistics;
      const cs =
        connections.getConnectionById(connId)?.info.connectionOptions
          .connectionString;
      if (!cs) {
        throw new Error(
          'Can not locate connection string for this connection.'
        );
      }
      await mcpService.setupNewConnection({ cs, connId, telemetry });
      dispatch({
        type: ConnectionStateActions.ConnectionEstablished,
      });
    } catch (error) {
      dispatch({
        type: ConnectionStateActions.ConnectionFailed,
        error: error as Error,
      });
    }
  };
}
export default connectionsReducer;
