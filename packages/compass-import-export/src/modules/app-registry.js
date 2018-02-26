/**
 * The prefix.
 */
const PREFIX = 'import-export/app-registry';

/**
 * Action for the registry activation.
 */
export const APP_REGISTRY_ACTIVATED = `${PREFIX}/APP_REGISTRY_ACTIVATED`;

/**
 * The initial ns state.
 */
const INITIAL_STATE = null;

/**
 * Create an app registry activated action.
 *
 * @param {String} ns - The namespace.
 *
 * @returns {Object} The action.
 */
export const appRegistryActivated = (appRegistry) => ({
  type: APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry
});

/**
 * Handle changes to the state.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === APP_REGISTRY_ACTIVATED) {
    return action.appRegistry;
  }
  return state;
};

export default reducer;
