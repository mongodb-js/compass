import { type ConnectionStorage } from '@mongodb-js/connection-storage/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import type { RootAction, SidebarThunkAction } from '.';

/**
 * Change connection action name.
 */
const CHANGE_CONNECTION_INFO =
  'sidebar/connection/CHANGE_CONNECTION_INFO' as const;
interface ChangeConnectionInfoAction {
  type: typeof CHANGE_CONNECTION_INFO;
  connectionInfo: ConnectionInfo;
}

/**
 * The initial state of the connection.
 */
export const INITIAL_STATE: ConnectionInfoState = {
  connectionInfo: {
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  },
};

export interface ConnectionInfoState {
  connectionInfo: Omit<ConnectionInfo, 'id'> & Partial<ConnectionInfo>;
}

export type ConnectionInfoAction = ChangeConnectionInfoAction;

async function saveConnectionInfo(
  connectionInfo: ConnectionInfo,
  connectionStorage: ConnectionStorage | null
) {
  try {
    await connectionStorage?.save?.({ connectionInfo });
  } catch {
    // Currently we silently fail if saving the favorite fails.
  }
}

/**
 * Changes the connection.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doChangeConnectionInfo = (
  state: ConnectionInfoState,
  action: ChangeConnectionInfoAction
) => {
  return { ...state, connectionInfo: action.connectionInfo };
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS: {
  [Type in ConnectionInfoAction['type']]: (
    state: ConnectionInfoState,
    action: ConnectionInfoAction & { type: Type }
  ) => ConnectionInfoState;
} = {
  [CHANGE_CONNECTION_INFO]: doChangeConnectionInfo,
};

/**
 * Reducer function for handle state changes.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 */
export default function reducer(
  state: ConnectionInfoState = INITIAL_STATE,
  action: RootAction
) {
  const fn = MAPPINGS[action.type as ConnectionInfoAction['type']];

  return fn ? fn(state, action as any) : state;
}

/**
 * Change connection action creator.
 *
 * @param {Object} connectionInfo - The connection info object.
 *
 * @returns {Object} The action.
 */
export const changeConnectionInfo = (
  connectionInfo: ConnectionInfo
): ChangeConnectionInfoAction => ({
  type: CHANGE_CONNECTION_INFO,
  connectionInfo,
});

export const updateAndSaveConnectionInfo = (
  connectionInfo: ConnectionInfo
): SidebarThunkAction<void, ChangeConnectionInfoAction> => {
  return (dispatch, getState, { connectionStorage }) => {
    void saveConnectionInfo(connectionInfo, connectionStorage);
    dispatch(changeConnectionInfo(connectionInfo));
  };
};
