import type { AnyAction } from 'redux';

/**
 * The action name prefix.
 */
const PREFIX = 'indexes/error';

/**
 * Handle error action name.
 */
export const HANDLE_ERROR = `${PREFIX}/HANDLE_ERROR`;

/**
 * Clear error action name.
 */
export const CLEAR_ERROR = `${PREFIX}/CLEAR_ERROR`;

/**
 * The initial state of the error.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to errors.
 *
 * @param {Error} state - The error state.
 * @param {Object} action - The action.
 *
 * @returns {Error} The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === HANDLE_ERROR) {
    return action.error;
  } else if (action.type === CLEAR_ERROR) {
    return null;
  }
  return state;
}

/**
 * Handle error action creator.
 *
 * @param {String} error - The error.
 *
 * @returns {String} The action.
 */
export const handleError = (error: string) => ({
  type: HANDLE_ERROR,
  error,
});

/**
 * Clear error action creator.
 *
 * @returns {Object} The action.
 */
export const clearError = () => ({
  type: CLEAR_ERROR,
});
