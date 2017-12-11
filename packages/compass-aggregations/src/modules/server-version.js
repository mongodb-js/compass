/**
 * Server version changed action.
 */
const SERVER_VERSION_CHANGED = 'aggregations/server-version/SERVER_VERSION_CHANGED';

/**
 * The initial state.
 */
const INITIAL_STATE = '3.6.0';

/**
 * Reducer function for handle state changes to stages.
 *
 * @param {String} state - The version state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === SERVER_VERSION_CHANGED) {
    return action.version;
  }
  return state;
};

/**
 * Action creator for server version changed events.
 *
 * @param {String} version - The version value.
 *
 * @returns {Object} The server version changed action.
 */
const serverVersionChanged = (version) => ({
  type: SERVER_VERSION_CHANGED,
  version: version
});

export default reducer;
export { serverVersionChanged, SERVER_VERSION_CHANGED };
