/**
 * Toggle is running action name.
 */
export const TOGGLE_IS_RUNNING = 'aggregations/create-view/is-running/TOGGLE_IS_RUNNING';

export const INITIAL_STATE = false;

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
  isRunning: isRunning
});
