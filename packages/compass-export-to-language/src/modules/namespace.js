/**
 * The prefix.
 */
const PREFIX = 'export-to-language/namespace';

/**
 * Namespace changed action.
 */
export const NAMESPACE_CHANGED = `${PREFIX}/NAMESPACE_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === NAMESPACE_CHANGED) {
    return action.namespace;
  }

  return state;
}

/**
 * Action creator for namespace changed events.
 *
 * @param {String} namespace - The namespace value.
 *
 * @returns {Object} The namespace changed action.
 */
export const namespaceChanged = (namespace) => ({
  type: NAMESPACE_CHANGED,
  namespace,
});
