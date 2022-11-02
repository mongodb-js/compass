/**
 * The prefix.
 */
const PREFIX = 'export-to-language/mode';

/**
 * Mode changed action.
 */
export const MODE_CHANGED = `${PREFIX}/MODE_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = 'Query';

/**
 * Reducer function for handle state changes to mode.
 *
 * @param {String} state - The mode state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === MODE_CHANGED) {
    return action.mode;
  }

  return state;
}

/**
 * Action creator for mode changed events.
 *
 * @param {String} mode - The mode value.
 *
 * @returns {Object} The mode changed action.
 */
export const modeChanged = (mode) => ({
  type: MODE_CHANGED,
  mode,
});
