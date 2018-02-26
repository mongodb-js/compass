/**
 * The prefix.
 */
const PREFIX = 'import-export/app-registry';

/**
 * Action for the registry activation.
 */
export const APP_REGISTRY_ACTIVATED = `${PREFIX}/APP_REGISTRY_ACTIVATED`;

/**
 * Action for emitting on the app registry.
 */
export const APP_REGISTRY_EMIT = `${PREFIX}/APP_REGISTRY_EMIT`;

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
export const appRegistryActivated = (appRegistry) => ({
  type: APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry
});

/**
 * Create an app registry emit action.
 *
 * @param {String} name - The name to emit.
 * @param {Array} args - The arguments.
 *
 * @returns {Object} The action.
 */
export const appRegistryEmit = (name, ...args) => ({
  type: APP_REGISTRY_EMIT,
  name: name,
  args: args
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
  } else if (action.type === APP_REGISTRY_EMIT) {
    state.emit(action.name, ...action.args);
    return state;
  }
  return state;
};

export default reducer;
