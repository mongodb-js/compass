/**
 * Namespace action.
 */
export const CHANGE_NAMESPACE = 'home/namespace/CHANGE_NAMESPACE';

/**
 * The initial state of the namespace.
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
  if (action.type === CHANGE_NAMESPACE) {
    return action.namespace;
  }
  return state;
}

/**
 * The change namespace action creator.
 *
 * @param {String} namespace - The namespace.
 *
 * @returns {Object} The action.
 */
export const changeNamespace = (namespace) => ({
  type: CHANGE_NAMESPACE,
  namespace: namespace
});
