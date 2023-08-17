import { ipcRenderer } from 'hadron-ipc';
import type AppRegistry from 'hadron-app-registry';
import type { Reducer, AnyAction } from 'redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { openModal, reducer as settingsReducer } from './settings';
import { PreferencesSandbox } from './preferences-sandbox';

export function configureStore({
  preferencesSandbox,
}: {
  preferencesSandbox?: Pick<
    PreferencesSandbox,
    | 'setupSandbox'
    | 'updateField'
    | 'getSandboxState'
    | 'applySandboxChangesToPreferences'
  >;
} = {}) {
  return createStore(
    combineReducers({
      settings: settingsReducer,
    }) as Reducer<{ settings: ReturnType<typeof settingsReducer> }>, // combineReducers CombinedState return type is broken, have to remove the EmptyObject from the union that it returns
    applyMiddleware(
      thunk.withExtraArgument({
        preferencesSandbox: preferencesSandbox ?? new PreferencesSandbox(),
      })
    )
  );
}

const store = configureStore();

export type RootState = ReturnType<typeof store['getState']>;

export type SettingsThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<
  R,
  RootState,
  {
    preferencesSandbox: Pick<
      PreferencesSandbox,
      | 'setupSandbox'
      | 'updateField'
      | 'getSandboxState'
      | 'applySandboxChangesToPreferences'
    >;
  },
  A
>;

(store as any).onActivated = (appRegistry: AppRegistry) => {
  appRegistry.on('open-compass-settings', () => {
    void store.dispatch(openModal());
  });
  ipcRenderer?.on('window:show-settings', () => {
    void store.dispatch(openModal());
  });
};

export default store as typeof store & {
  onActivated(appRegistry: AppRegistry): void;
};
