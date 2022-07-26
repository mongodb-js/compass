import { ConnectionStorage } from 'mongodb-data-service';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { debug } = createLoggerAndTelemetry('COMPASS-SIDEBAR');

/**
 * Change connection action name.
 */
const CHANGE_CONNECTION_INFO = 'sidebar/connection/CHANGE_CONNECTION_INFO';

/**
 * Save favorite connection action name.
 */
const SAVE_CONNECTION_INFO = 'sidebar/connection/SAVE_CONNECTION_INFO';

/**
 * The initial state of the connection.
 */
export const INITIAL_STATE = {
  connectionInfo: {
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  },
  connectionStorage: new ConnectionStorage(),
};

async function saveConnectionInfo(connectionInfo, connectionStorage) {
  try {
    await connectionStorage.save(connectionInfo);
    debug(`saved connection with id ${connectionInfo.id || ''}`);
  } catch (err) {
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
const doChangeConnectionInfo = (state, action) => {
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
const doSaveConnectionInfo = (state, action) => {
  saveConnectionInfo(action.connectionInfo, state.connectionStorage);

  return { ...state, connectionInfo: action.connectionInfo };
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {
  [CHANGE_CONNECTION_INFO]: doChangeConnectionInfo,
  [SAVE_CONNECTION_INFO]: doSaveConnectionInfo,
};

/**
 * Reducer function for handle state changes.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];

  return fn ? fn(state, action) : state;
}

/**
 * Change connection action creator.
 *
 * @param {Object} connectionInfo - The connection info object.
 *
 * @returns {Object} The action.
 */
export const changeConnectionInfo = (connectionInfo) => ({
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
export const updateAndSaveConnectionInfo = (connectionInfo) => ({
  type: SAVE_CONNECTION_INFO,
  connectionInfo,
});
