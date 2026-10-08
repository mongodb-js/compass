import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  restoreSignInState,
  tokenRefreshFailed,
} from './atlas-signin-reducer';
import { AtlasSignInStoreContext } from './atlas-signin-store-context';
import { type AtlasAuthService } from '../provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { ipcRenderer } from 'hadron-ipc';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { PreferencesAccess } from 'compass-preferences-model/provider';

export type AtlasAuthPluginServices = {
  atlasAuthService: AtlasAuthService;
  track?: TrackFunction;
  preferences?: PreferencesAccess;
};
export function activatePlugin(
  _initialProps: unknown,
  services: AtlasAuthPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(services);

  const onTokenRefreshFailed = () => store.dispatch(tokenRefreshFailed());

  if (ipcRenderer) {
    on(ipcRenderer, 'atlas-service-token-refresh-failed', onTokenRefreshFailed);
  }

  // Restore the sign-in state when the plugin is activated
  void store.dispatch(restoreSignInState());

  return { store, deactivate: cleanup, context: AtlasSignInStoreContext };
}

export function configureStore({
  atlasAuthService,
  track = createNoopTrack(),
  preferences,
}: AtlasAuthPluginServices) {
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({ atlasAuthService, track, preferences })
    )
  );
  return store;
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;
