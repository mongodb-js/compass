import {
  ConnectionStorage,
  type ConnectionInfo,
} from '@mongodb-js/connection-storage/renderer';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { RootAction } from '.';

const { debug } = createLoggerAndTelemetry('COMPASS-SIDEBAR');

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
 * Save favorite connection action name.
 */
const SAVE_CONNECTION_INFO = 'sidebar/connection/SAVE_CONNECTION_INFO' as const;

interface SaveConnectionInfoAction {
  type: typeof SAVE_CONNECTION_INFO;
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
  connectionStorage: ConnectionStorage,
};

export interface ConnectionInfoState {
  connectionInfo: Omit<ConnectionInfo, 'id'> & Partial<ConnectionInfo>;
  connectionStorage: typeof ConnectionStorage;
}

export type ConnectionInfoAction =
  | ChangeConnectionInfoAction
  | SaveConnectionInfoAction;

async function saveConnectionInfo(
  connectionInfo: ConnectionInfo,
  connectionStorage: typeof ConnectionStorage
) {
  try {
    await connectionStorage.save({ connectionInfo });
    debug(`saved connection with id ${connectionInfo.id || ''}`);
  } catch (err: any) {
    // Currently we silently fail if saving the favorite fails.
    debug(
      `error saving connection with id ${connectionInfo.id || ''}: ${
        err.message
      }`
    );
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
 * Saves the new favorite connection info.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doSaveConnectionInfo = (
  state: ConnectionInfoState,
  action: SaveConnectionInfoAction
) => {
  void saveConnectionInfo(action.connectionInfo, state.connectionStorage);

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
  [SAVE_CONNECTION_INFO]: doSaveConnectionInfo,
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

/**
 * Save connection info action creator.
 *
 * @param {Object} connectionInfo - The connection info object.
 *
 * @returns {Object} The action.
 */
export const updateAndSaveConnectionInfo = (
  connectionInfo: ConnectionInfo
): SaveConnectionInfoAction => ({
  type: SAVE_CONNECTION_INFO,
  connectionInfo,
});
