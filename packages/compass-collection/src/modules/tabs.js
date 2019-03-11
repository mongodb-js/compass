/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Namespace selected action name.
 */
export const NAMESPACE_SELECTED = `${PREFIX}/tabs/NAMESPACE_SELECTED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

/**
 * Handles namespace selected actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doNamespaceSelected = (state, action) => {
  // If we don't have any tabs open, then open a new tab with the
  // namespace and select it.
  if (state.length === 0) {
    return [
      {
        namespace: action.namespace,
        isActive: true,
        isReadonly: action.isReadonly
      }
    ];
  }
};

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [NAMESPACE_SELECTED]: doNamespaceSelected
};

/**
 * Reducer function for handle state changes to the tabs.
 *
 * @param {String} state - The tabs state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * Action creator for namespace selected.
 *
 * @param {String} namespace - The namespace.
 * @param {Boolean} isReadonly - Is the collection readonly?
 *
 * @returns {Object} The namespace selected action.
 */
export const namespaceSelected = (namespace, isReadonly) => ({
  type: NAMESPACE_SELECTED,
  namespace: namespace,
  isReadonly: isReadonly
});
