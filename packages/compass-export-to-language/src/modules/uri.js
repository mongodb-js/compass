/**
 * The prefix.
 */
const PREFIX = 'export-to-language/uri';

/**
 * Uri changed action.
 */
export const URI_CHANGED = `${PREFIX}/URI_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to uri.
 *
 * @param {String} state - The uri state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === URI_CHANGED) {
    return action.uri;
  }

  return state;
}

/**
 * Action creator for uri changed events.
 *
 * @param {String} uri - The uri value.
 *
 * @returns {Object} The uri changed action.
 */
export const uriChanged = (uri) => ({
  type: URI_CHANGED,
  uri,
});
