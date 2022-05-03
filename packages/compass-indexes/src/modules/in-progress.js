/**
 * Change in progress action name.
 */
export const TOGGLE_IN_PROGRESS = 'indexes/in-progress/TOGGLE_IN_PROGRESS';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to in progress.
 *
 * @param {Boolean} state - The in progress state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IN_PROGRESS) {
    return action.inProgress;
  }
  return state;
}

/**
 * The toggle in progress action creator.
 *
 * @param {Boolean} inProgress - In progress.
 *
 * @returns {Object} The action.
 */
export const toggleInProgress = (inProgress) => ({
  type: TOGGLE_IN_PROGRESS,
  inProgress: inProgress,
});
