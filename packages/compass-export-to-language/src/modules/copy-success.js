/**
 * The prefix.
 */
const PREFIX = 'export-to-language/copy-success';

/**
 * CopySuccess changed action.
 */
export const COPY_SUCCESS_CHANGED = `${PREFIX}/COPY_SUCCESS_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to copySuccess.
 *
 * @param {String} state - The copySuccess state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === COPY_SUCCESS_CHANGED) {
    return action.copySuccess;
  }

  return state;
}

/**
 * Action creator for copySuccess changed events.
 *
 * @param {String} copySuccess - The copySuccess value.
 *
 * @returns {Object} The copySuccess changed action.
 */
export const copySuccessChanged = (copySuccess) => ({
  type: COPY_SUCCESS_CHANGED,
  copySuccess,
});
