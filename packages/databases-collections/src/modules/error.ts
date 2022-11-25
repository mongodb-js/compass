import type { AnyAction } from 'redux';

/**
 * The action name prefix.
 */
const PREFIX = 'databases-collections/error';

/**
 * Handle error action name.
 */
export const HANDLE_ERROR = `${PREFIX}/HANDLE_ERROR`;

/**
 * Clear error action name.
 */
export const CLEAR_ERROR = `${PREFIX}/CLEAR_ERROR`;

type State = null | Error;

/**
 * The initial state of the error.
 */
export const INITIAL_STATE: State = null;

/**
 * Reducer function for handle state changes to errors.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (action.type === HANDLE_ERROR) {
    return action.error;
  } else if (action.type === CLEAR_ERROR) {
    return null;
  }
  return state;
}

/**
 * Handle error action creator.
 */
export const handleError = (error: Error) => ({
  type: HANDLE_ERROR,
  error: error,
});

/**
 * Clear error action creator.
 *
 * @returns {Object} The action.
 */
export const clearError = () => ({
  type: CLEAR_ERROR,
});
