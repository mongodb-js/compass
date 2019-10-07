const merge = require('lodash.merge');

/**
 * Change connection action name.
 */
export const CHANGE_CONNECTION = 'sidebar/connection/CHANGE_CONNECTION';

/**
 * Delete favorite action name.
 */
export const DELETE_FAVORITE = 'sidebar/connection/DELETE_FAVORITE';

/**
 * Save favorite action name.
 */
export const SAVE_FAVORITE = 'sidebar/connection/SAVE_FAVORITE';

/**
 * The initial state of the connection.
 */
export const INITIAL_STATE = {};

/**
 * Changes the connection.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doChangeConnection = (state, action) => {
  return action.connection;
};

/**
 * Saves the favorite.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doSaveFavorite = (state, action) => {
  const connection = merge(
    action.connection,
    { isFavorite: true, name: action.name, color: action.color }
  );

  connection.save();

  return { ...state, isFavorite: true, name: action.name, color: action.color };
};

/**
 * Deletes the favorite.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doDeleteFavorite = (state, action) => {
  action.connection.destroy();

  return { ...state, isFavorite: false, name: '', color: undefined };
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {
  [CHANGE_CONNECTION]: doChangeConnection,
  [SAVE_FAVORITE]: doSaveFavorite,
  [DELETE_FAVORITE]: doDeleteFavorite
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
 * @param {Connection} connection - The connection.
 *
 * @returns {Object} The action.
 */
export const changeConnection = (connection) => ({
  type: CHANGE_CONNECTION,
  connection
});

/**
 * Save favorite action creator.
 *
 * @param {Object} connection - The connection.
 * @param {String} name - The connection name.
 * @param {String} color - The connection color.
 *
 * @returns {Object} The action.
 */
export const saveFavorite = (connection, name, color) => ({
  type: SAVE_FAVORITE,
  connection,
  name,
  color
});

/**
 * Delete favorite action creator.
 *
 * @param {Object} connection - The connection.
 *
 * @returns {Object} The action.
 */
export const deleteFavorite = (connection) => ({
  type: DELETE_FAVORITE,
  connection
});
