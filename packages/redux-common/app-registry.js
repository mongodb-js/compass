/**
 * The prefix.
 */
const PREFIX = '@mongodb-js/mongodb-redux-common/app-registry';

/**
 * Local app registry activated.
 */
const LOCAL_APP_REGISTRY_ACTIVATED = `${PREFIX}/LOCAL_APP_REGISTRY_ACTIVATED`;

/**
 * Global app registry activated.
 */
const GLOBAL_APP_REGISTRY_ACTIVATED = `${PREFIX}/GLOBAL_APP_REGISTRY_ACTIVATED`;

/**
 * The initial state.
 */
const INITIAL_STATE = {
  localAppRegistry: null,
  globalAppRegistry: null
};

/**
 * Reducer function for handle state changes to the app registry.
 *
 * @param {Object} state - The app registry state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === LOCAL_APP_REGISTRY_ACTIVATED) {
    return { ...state, localAppRegistry: action.appRegistry };
  } else if (action.type === GLOBAL_APP_REGISTRY_ACTIVATED) {
    return { ...state, globalAppRegistry: action.appRegistry };
  }
  return state;
};

/**
 * Action creator for local app registry activated events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 *
 * @returns {Object} The app registry activated event.
 */
const localAppRegistryActivated = (appRegistry) => ({
  type: LOCAL_APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry
});

/**
 * Action creator for global app registry activated events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 *
 * @returns {Object} The app registry activated event.
 */
const globalAppRegistryActivated = (appRegistry) => ({
  type: GLOBAL_APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry
});

/**
 * Emit an event on the provided app registry.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 * @param {String} name - The event name.
 * @param {Object} metadata - The event metadata.
 */
const appRegistryEmit = (appRegistry, name, ...metadata) => {
  if (appRegistry) {
    appRegistry.emit(name, ...metadata);
  }
};

/**
 * Emit an event to the local app registry.
 *
 * @param {String} name - The event name.
 * @param {Object} metadata - The metadata.
 *
 * @returns {Function} The thunk function.
 */
const localAppRegistryEmit = (name, ...metadata) => {
  return (dispatch, getState) => {
    appRegistryEmit(getState().appRegistry.localAppRegistry, name, ...metadata);
  };
};

/**
 * Emit an event to the app registry.
 *
 * @param {String} name - The event name.
 * @param {Object} metadata - The metadata.
 *
 * @returns {Function} The thunk function.
 */
const globalAppRegistryEmit = (name, ...metadata) => {
  return (dispatch, getState) => {
    appRegistryEmit(getState().appRegistry.globalAppRegistry, name, ...metadata);
  };
};

module.exports = reducer;
module.exports.LOCAL_APP_REGISTRY_ACTIVATED = LOCAL_APP_REGISTRY_ACTIVATED;
module.exports.GLOBAL_APP_REGISTRY_ACTIVATED = GLOBAL_APP_REGISTRY_ACTIVATED;
module.exports.INITIAL_STATE = INITIAL_STATE;
module.exports.localAppRegistryActivated = localAppRegistryActivated;
module.exports.globalAppRegistryActivated = globalAppRegistryActivated;
module.exports.localAppRegistryEmit = localAppRegistryEmit;
module.exports.globalAppRegistryEmit = globalAppRegistryEmit;
