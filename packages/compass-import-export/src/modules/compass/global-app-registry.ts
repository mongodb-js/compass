import type AppRegistry from 'hadron-app-registry';
import type { AnyAction } from 'redux';

/**
 * The prefix.
 */
const PREFIX = 'import-export/global-app-registry';

/**
 * Action for the registry activation.
 */
export const GLOBAL_APP_REGISTRY_ACTIVATED = `${PREFIX}/GLOBAL_APP_REGISTRY_ACTIVATED`;

export const GLOBAL_APP_REGISTRY_EMIT = `${PREFIX}/GLOBAL_APP_REGISTRY_EMIT`;

type State = AppRegistry | null;
/**
 * The initial ns state.
 */
const INITIAL_STATE: State = null;

/**
 * Create an app registry activated action.
 *
 * @param {Object} appRegistry - The app registry.
 *
 * @returns {Object} The action.
 */
export const globalAppRegistryActivated = (appRegistry: AppRegistry) => ({
  type: GLOBAL_APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry,
});

export const globalAppRegistryEmit = (name: string, ...args: unknown[]) => ({
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
const reducer = (state: State = INITIAL_STATE, action: AnyAction) => {
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
