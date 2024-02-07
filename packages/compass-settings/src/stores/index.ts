import { ipcRenderer } from 'hadron-ipc';
import type AppRegistry from 'hadron-app-registry';
import type { Reducer, AnyAction } from 'redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import { PreferencesSandbox } from './preferences-sandbox';
import { openModal, reducer as settingsReducer } from './settings';
import atlasLoginReducer, {
  getUserInfo,
  atlasServiceSignedOut,
  atlasServiceTokenRefreshFailed,
  atlasServiceUserConfigChanged,
} from './atlas-login';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import { AtlasServices } from '@mongodb-js/atlas-service/provider';
import type { PreferencesAccess } from 'compass-preferences-model';

export type Public<T> = { [K in keyof T]: T[K] };

type ThunkExtraArg = {
  preferencesSandbox: Public<PreferencesSandbox>;
  atlasServices: AtlasServices;
  logger: LoggerAndTelemetry;
  preferences: PreferencesAccess;
};

export function configureStore(
  options: Pick<ThunkExtraArg, 'logger' | 'preferences' | 'atlasServices'> &
    Partial<ThunkExtraArg>
) {
  const preferencesSandbox =
    options?.preferencesSandbox ?? new PreferencesSandbox(options.preferences);

  const atlasServices = options.atlasServices;

  const store = createStore(
    combineReducers({
      settings: settingsReducer,
      atlasLogin: atlasLoginReducer,
    }) as Reducer<{
      settings: ReturnType<typeof settingsReducer>;
      atlasLogin: ReturnType<typeof atlasLoginReducer>;
    }>, // combineReducers CombinedState return type is broken, have to remove the EmptyObject from the union that it returns
    applyMiddleware(
      thunk.withExtraArgument({
        preferences: options.preferences,
        preferencesSandbox,
        atlasServices,
        logger: options.logger,
      })
    )
  );

  atlasServices.authClient.on('signed-in', () => {
    void store.dispatch(getUserInfo());
  });

  atlasServices.authClient.on('signed-out', () => {
    void store.dispatch(atlasServiceSignedOut());
  });

  atlasServices.authClient.on('token-refresh-failed', () => {
    void store.dispatch(atlasServiceTokenRefreshFailed());
  });

  atlasServices.authClient.on('user-config-changed', (newConfig) => {
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
> = ThunkAction<R, RootState, ThunkExtraArg, A>;

const onActivated = (
  _: unknown,
  {
    globalAppRegistry,
    logger,
    preferences,
    atlasServices,
  }: {
    globalAppRegistry: AppRegistry;
    logger: LoggerAndTelemetry;
    preferences: PreferencesAccess;
    atlasServices: AtlasServices;
  }
) => {
  const store = configureStore({ logger, preferences, atlasServices });

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
