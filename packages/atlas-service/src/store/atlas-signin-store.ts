import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { ipcRenderer } from '@mongodb-js/hadron-ipc';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { type AtlasAuthService } from '../provider';
import { AtlasSignInStoreContext } from './atlas-signin-store-context';
import reducer, {
  restoreSignInState,
  tokenRefreshFailed,
} from './atlas-signin-reducer';

export type AtlasAuthPluginServices = {
  atlasAuthService: AtlasAuthService;
  track?: TrackFunction;
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
}: AtlasAuthPluginServices) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasAuthService, track }))
  );
  return store;
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;
