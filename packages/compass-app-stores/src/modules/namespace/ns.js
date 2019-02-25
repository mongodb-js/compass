/**
 * Create ns.
 */
export const CHANGE_NAMESPACE = 'app/namespace/CHANGE_NAMESPACE';

/**
 * The initial state of the ns.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to ns.
 *
 * @param {String} state - The ns state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_NAMESPACE) {
    return action.ns;
  }
  return state;
}

/**
 * The change ns action creator.
 *
 * @param {String} ns - The ns.
 *
 * @returns {Object} The action.
 */
export const changeNamespace = (ns) => ({
  type: CHANGE_NAMESPACE,
  ns: ns
});
