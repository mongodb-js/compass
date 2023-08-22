import { ipcRenderer } from 'hadron-ipc';
import type AppRegistry from 'hadron-app-registry';
import type { Reducer, AnyAction } from 'redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { AtlasService } from '@mongodb-js/atlas-service/renderer';
import { PreferencesSandbox } from './preferences-sandbox';
import { openModal, reducer as settingsReducer } from './settings';
import atlasLoginReducer, {
  getUserInfo,
  atlasServiceSignedOut,
  atlasServiceTokenRefreshFailed,
} from './atlas-login';

export function configureStore({
  preferencesSandbox,
  atlasService,
}: {
  preferencesSandbox?: Pick<
    PreferencesSandbox,
    | 'setupSandbox'
    | 'updateField'
    | 'getSandboxState'
    | 'applySandboxChangesToPreferences'
  >;
  atlasService?: AtlasService;
} = {}) {
  preferencesSandbox ??= new PreferencesSandbox();
  atlasService ??= new AtlasService();

  const store = createStore(
    combineReducers({
      settings: settingsReducer,
      atlasLogin: atlasLoginReducer,
    }) as Reducer<{
      settings: ReturnType<typeof settingsReducer>;
      atlasLogin: ReturnType<typeof atlasLoginReducer>;
    }>, // combineReducers CombinedState return type is broken, have to remove the EmptyObject from the union that it returns
    applyMiddleware(
      thunk.withExtraArgument({ preferencesSandbox, atlasService })
    )
  );

  atlasService.on('signed-in', () => {
    void store.dispatch(getUserInfo());
  });

  atlasService.on('signed-out', () => {
    void store.dispatch(atlasServiceSignedOut());
  });

  atlasService.on('token-refresh-failed', () => {
    void store.dispatch(atlasServiceTokenRefreshFailed());
  });

  return store;
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
    atlasService: AtlasService;
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
