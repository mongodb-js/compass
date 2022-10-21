/**
 * Toggle is running action name.
 */
export const TOGGLE_IS_RUNNING =
  'databases-collections/is-running/TOGGLE_IS_RUNNING';

/**
 * The initial state of the is running attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is running.
 *
 * @param {Boolean} state - The is running state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_RUNNING) {
    return action.isRunning;
  }
  return state;
}

/**
 * The toggle is running action creator.
 *
 * @param {Boolean} isRunning - Is running.
 *
 * @returns {Object} The action.
 */
export const toggleIsRunning = (isRunning) => ({
  type: TOGGLE_IS_RUNNING,
  isRunning: isRunning,
});
