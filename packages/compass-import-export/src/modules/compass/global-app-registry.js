/**
 * The prefix.
 */
const PREFIX = 'import-export/global-app-registry';

/**
 * Action for the registry activation.
 */
export const GLOBAL_APP_REGISTRY_ACTIVATED = `${PREFIX}/GLOBAL_APP_REGISTRY_ACTIVATED`;

export const GLOBAL_APP_REGISTRY_EMIT = `${PREFIX}/GLOBAL_APP_REGISTRY_EMIT`;

/**
 * The initial ns state.
 */
const INITIAL_STATE = null;

/**
 * Create an app registry activated action.
 *
 * @param {String} appRegistry - The app registry.
 *
 * @returns {Object} The action.
 */
export const globalAppRegistryActivated = (appRegistry) => ({
  type: GLOBAL_APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry,
});

export const globalAppRegistryEmit = (name, ...args) => ({
  type: GLOBAL_APP_REGISTRY_EMIT,
  name: name,
  args: args,
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
  if (action.type === GLOBAL_APP_REGISTRY_ACTIVATED) {
    return action.appRegistry;
  }
  if (action.type === GLOBAL_APP_REGISTRY_EMIT) {
    if (state) {
      // HACK: lucas: https://github.com/mongodb-js/compass-import-export/pulls/23
      state.emit(action.name, ...action.args);
    }
    return state;
  }
  return state;
};

export default reducer;
