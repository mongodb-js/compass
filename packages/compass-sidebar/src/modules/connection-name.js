/**
 * Change connection name action name.
 */
export const CHANGE_CONNECTION_NAME = 'sidebar/connection-name/CHANGE_CONNECTION_NAME';

/**
 * The initial state of the sidebar instance.
 */
export const INITIAL_STATE = 'My Cluster';

/**
 * Reducer function for handle state changes to connection name.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_CONNECTION_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change connection name.
 *
 * @param {Connection} connection - The connection.
 *
 * @returns {Object} The action.
 */
export const changeConnectionName = (connection) => ({
  type: CHANGE_CONNECTION_NAME,
  name: connection.is_favorite ? connection.name : INITIAL_STATE
});
