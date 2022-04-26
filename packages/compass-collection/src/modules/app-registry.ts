import type { AnyAction } from 'redux';
import type AppRegistry from 'hadron-app-registry';

/**
 * The prefix.
 */
const PREFIX = 'collection/app-registry';

/**
 * App registry activated.
 */
export const APP_REGISTRY_ACTIVATED = `${PREFIX}/APP_REGISTRY_ACTIVATED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to the app registry.
 *
 * @param {String} state - The app registry state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): AppRegistry | null {
  if (action.type === APP_REGISTRY_ACTIVATED) {
    return action.appRegistry;
  }
  return state;
}

/**
 * Action creator for app registry activated events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 *
 * @returns {Object} The app registry activated event.
 */
export const appRegistryActivated = (
  appRegistry: AppRegistry
): {
  type: string;
  appRegistry: AppRegistry;
} => ({
  type: APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry,
});

/**
 * Emit an event to the app registry.
 *
 * @param {String} name - The event name.
 * @param {Object} metadata - The metadata.
 *
 * @returns {Function} The thunk function.
 */
export const appRegistryEmit = (name: string, metadata?: any): any => {
  return (dispatch: any, getState: any) => {
    const state = getState();
    if (state.appRegistry) {
      state.appRegistry.emit(name, metadata);
    }
  };
};
