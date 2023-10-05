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
  atlasServiceUserConfigChanged,
} from './atlas-login';

export type Public<T> = { [K in keyof T]: T[K] };

export function configureStore({
  preferencesSandbox,
  atlasService,
}: {
  preferencesSandbox?: Public<PreferencesSandbox>;
  atlasService?: Public<AtlasService>;
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

  atlasService.on('user-config-changed', (newConfig) => {
    void store.dispatch(atlasServiceUserConfigChanged(newConfig));
  });

  return store;
}

export type RootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type SettingsThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<
  R,
  RootState,
  {
    preferencesSandbox: Public<PreferencesSandbox>;
    atlasService: Public<AtlasService>;
  },
  A
>;

const onActivated = (
  _: unknown,
  { globalAppRegistry }: { globalAppRegistry: AppRegistry }
) => {
  const store = configureStore();

  const onOpenSettings = () => {
    void store.dispatch(openModal());
  };

  globalAppRegistry.on('open-compass-settings', onOpenSettings);
  ipcRenderer?.on('window:show-settings', onOpenSettings);

  return {
    store,
    deactivate() {
      globalAppRegistry.removeListener('open-compass-settings', onOpenSettings);
      ipcRenderer?.removeListener('window:show-settings', onOpenSettings);
    },
  };
};

export { onActivated };
