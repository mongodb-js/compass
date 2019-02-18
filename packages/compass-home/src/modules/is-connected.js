/**
 * The module action prefix.
 */
const PREFIX = 'home';

/**
 * The isConnected action type.
 */
export const TOGGLE_IS_CONNECTED = `${PREFIX}/is-connected/TOGGLE_IS_CONNECTED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isConnected.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_IS_CONNECTED) {
    return action.isConnected;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isConnected events.
 *
 * @param {Boolean} isConnected
 * @returns {Object} The isConnected action.
 */
export const toggleIsConnected = (isConnected) => ({
  type: TOGGLE_IS_CONNECTED,
  isConnected: isConnected
});
