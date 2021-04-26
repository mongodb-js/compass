/**
 * Error message action.
 */
export const CHANGE_ERROR_MESSAGE = 'home/error-message/CHANGE_ERROR_MESSAGE';

/**
 * The initial state of the error message.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to error message.
 *
 * @param {String} state - The error message state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_ERROR_MESSAGE) {
    return action.errorMessage;
  }
  return state;
}

/**
 * The change errorMessage action creator.
 *
 * @param {String} errorMessage - The errorMessage.
 *
 * @returns {Object} The action.
 */
export const changeErrorMessage = (errorMessage) => ({
  type: CHANGE_ERROR_MESSAGE,
  errorMessage: errorMessage
});
