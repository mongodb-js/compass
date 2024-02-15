import { ipcRenderer } from 'hadron-ipc';
import type AppRegistry from 'hadron-app-registry';
import type { Reducer, AnyAction } from 'redux';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import {
  AtlasAuthService,
  type AtlasService,
} from '@mongodb-js/atlas-service/renderer';
import { AtlasAiService } from '@mongodb-js/compass-generative-ai';
import { PreferencesSandbox } from './preferences-sandbox';
import { openModal, reducer as settingsReducer } from './settings';
import atlasLoginReducer, {
  getUserInfo,
  atlasServiceSignedOut,
  atlasServiceTokenRefreshFailed,
  atlasServiceUserConfigChanged,
} from './atlas-login';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import type { PreferencesAccess } from 'compass-preferences-model';

export type Public<T> = { [K in keyof T]: T[K] };

export type SettingsThunkExtraArgs = {
  preferencesSandbox: Public<PreferencesSandbox>;
  atlasAuthService: Public<AtlasAuthService>;
  logger: LoggerAndTelemetry;
  preferences: PreferencesAccess;
  atlasAiService: AtlasAiService;
};

export type SettingsPluginServices = {
  logger: LoggerAndTelemetry;
  preferences: PreferencesAccess;
  atlasService: AtlasService;
};

export function configureStore(
  options: SettingsPluginServices & Partial<SettingsThunkExtraArgs>
) {
  const preferencesSandbox =
    options?.preferencesSandbox ?? new PreferencesSandbox(options.preferences);
  const atlasAuthService = options?.atlasAuthService ?? new AtlasAuthService();

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
        atlasAuthService,
        logger: options.logger,
        atlasAiService: AtlasAiService.getInstance(options.atlasService),
      })
    )
  );

  atlasAuthService.on('signed-in', () => {
    void store.dispatch(getUserInfo());
  });

  atlasAuthService.on('signed-out', () => {
    void store.dispatch(atlasServiceSignedOut());
  });

  atlasAuthService.on('token-refresh-failed', () => {
    void store.dispatch(atlasServiceTokenRefreshFailed());
  });

  atlasAuthService.on('user-config-changed', (newConfig) => {
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
> = ThunkAction<R, RootState, SettingsThunkExtraArgs, A>;

const onActivated = (
  _: unknown,
  {
    globalAppRegistry,
    logger,
    preferences,
    atlasService,
  }: SettingsPluginServices & {
    globalAppRegistry: Pick<AppRegistry, 'on' | 'removeListener'>;
  }
) => {
  const store = configureStore({ logger, preferences, atlasService });

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
