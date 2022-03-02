/**
 * Source name changed action.
 */
export const SOURCE_NAME_CHANGED = 'aggregations/source-name/SOURCE_NAME_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to source name.
 *
 * @param {any} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SOURCE_NAME_CHANGED) {
    return action.sourceName;
  }
  return state;
}

/**
 * Action creator for source name changed events.
 *
 * @param {String} sourceName - The source name value.
 *
 * @returns {Object} The name changed action.
 */
export const sourceNameChanged = (sourceName) => ({
  type: SOURCE_NAME_CHANGED,
  sourceName: sourceName
});
