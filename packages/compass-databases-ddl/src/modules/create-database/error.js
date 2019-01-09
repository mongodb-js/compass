/**
 * Handle error action name.
 */
export const HANDLE_ERROR = 'ddl/create-database/error/HANDLE_ERROR';

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
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === HANDLE_ERROR) {
    return action.error;
  }
  return state;
}

/**
 * Handle error action creator.
 *
 * @param {Error} error - The error.
 *
 * @returns {Object} The action.
 */
export const handleError = (error) => ({
  type: HANDLE_ERROR,
  error: error
});
