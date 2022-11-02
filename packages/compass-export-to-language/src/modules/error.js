/**
 * The prefix.
 */
const PREFIX = 'export-to-language/error';

/**
 * Error changed action.
 */
export const ERROR_CHANGED = `${PREFIX}/ERROR_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to Error.
 *
 * @param {String} state - The Error state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === ERROR_CHANGED) {
    return action.error;
  }

  return state;
}

/**
 * Action creator for Error changed events.
 *
 * @param {String} error - The Error value.
 *
 * @returns {Object} The error changed action.
 */
export const errorChanged = (error) => ({
  type: ERROR_CHANGED,
  error,
});
