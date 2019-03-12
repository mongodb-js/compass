/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Namespace selected action name.
 */
export const SELECT_NAMESPACE = `${PREFIX}/tabs/SELECT_NAMESPACE`;

/**
 * Create tab action name.
 */
export const CREATE_TAB = `${PREFIX}/tabs/CREATE_TAB`;

/**
 * Close tab action name.
 */
export const CLOSE_TAB = `${PREFIX}/tabs/CLOSE_TAB`;

/**
 * Select tab action name.
 */
export const SELECT_TAB = `${PREFIX}/tabs/SELECT_TAB`;

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
const doSelectNamespace = (state, action) => {
  if (state.length === 0) {
    // If we don't have any tabs open, then open a new tab with the
    // namespace and set it to the active one.
    return [
      {
        namespace: action.namespace,
        isActive: true,
        isReadonly: action.isReadonly
      }
    ];
  }
  // If we have tabs open, then switch the currently active tab
  // to the new namespace.
  return state.reduce((newState, tab) => {
    if (tab.isActive) {
      newState.push({
        namespace: action.namespace,
        isActive: true,
        isReadonly: action.isReadonly
      });
    } else {
      newState.push({ ...tab });
    }
    return newState;
  }, []);
};

/**
 * Handle create tab actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doCreateTab = (state, action) => {
  const newState = state.map((tab) => {
    return { ...tab, isActive: false };
  });
  newState.push({
    namespace: action.namespace,
    isActive: false,
    isReadonly: action.isReadonly
  });
  return newState;
};

const doCloseTab = (state, action) => {
  return state.reduce((newState, tab, i) => {
    if (action.index !== i) {
      newState.push({ ...tab });
    }
    return newState;
  }, []);
};

/**
 * Handle select tab actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doSelectTab = (state, action) => {
  return state.map((tab, i) => {
    return { ...tab, isActive: (action.index === i) ? true : false };
  });
};

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [SELECT_NAMESPACE]: doSelectNamespace,
  [CREATE_TAB]: doCreateTab,
  [CLOSE_TAB]: doCloseTab,
  [SELECT_TAB]: doSelectTab
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
 * Action creator for create tab.
 *
 * @param {String} namespace - The namespace.
 * @param {Boolean} isReadonly - Is the collection readonly?
 *
 * @returns {Object} The create tab action.
 */
export const createTab = (namespace, isReadonly) => ({
  type: CREATE_TAB,
  namespace: namespace,
  isReadonly: isReadonly
});

/**
 * Action creator for close tab.
 *
 * @param {Number} index - The tab index.
 *
 * @returns {Object} The close tab action.
 */
export const closeTab = (index) => ({
  type: CLOSE_TAB,
  index: index
});

/**
 * Action creator for namespace selected.
 *
 * @param {String} namespace - The namespace.
 * @param {Boolean} isReadonly - Is the collection readonly?
 *
 * @returns {Object} The namespace selected action.
 */
export const selectNamespace = (namespace, isReadonly) => ({
  type: SELECT_NAMESPACE,
  namespace: namespace,
  isReadonly: isReadonly
});

/**
 * Action creator for selecting tabs.
 *
 * @param {Number} index - The tab index.
 *
 * @returns {Object} The action.
 */
export const selectTab = (index) => ({
  type: SELECT_TAB,
  index: index
});
