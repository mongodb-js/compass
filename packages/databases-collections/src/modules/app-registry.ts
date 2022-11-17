import type { AnyAction } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

/**
 * The prefix.
 */
const PREFIX = 'aggregations/app-registry';

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
 */
export const appRegistryActivated = (appRegistry: AppRegistry) => ({
  type: APP_REGISTRY_ACTIVATED,
  appRegistry: appRegistry,
});

/**
 * Emit an event to the app registry.
 */
export const appRegistryEmit = (
  name: string,
  ...metadata: any
): ThunkAction<
  void,
  {
    appRegistry: AppRegistry | null;
  },
  void,
  AnyAction
> => {
  return (
    dispatch: ThunkDispatch<
      {
        appRegistry: AppRegistry | null;
      },
      void,
      AnyAction
    >,
    getState: () => {
      appRegistry: AppRegistry | null;
    }
  ) => {
    const state = getState();
    if (state.appRegistry) {
      state.appRegistry.emit(name, ...metadata);
    }
  };
};
