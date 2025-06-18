import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  restoreSignInState,
  signedOut,
  tokenRefreshFailed,
} from './atlas-signin-reducer';
import { type AtlasAuthService } from '../provider';
import { ipcRenderer } from 'hadron-ipc';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';

let store: AtlasServiceStore;
export function getStore() {
  if (!store) {
    throw new Error('AtlasAuthPlugin not activated');
  }
  return store;
}

export type AtlasAuthPluginServices = {
  atlasAuthService: AtlasAuthService;
};
export function activatePlugin(
  _: Record<string, never>,
  services: AtlasAuthPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  store = configureStore(services);

  const onSignedOut = () => store.dispatch(signedOut());
  const onTokenRefreshFailed = () => store.dispatch(tokenRefreshFailed());

  if (ipcRenderer) {
    on(ipcRenderer, 'atlas-service-token-refresh-failed', onTokenRefreshFailed);
    on(ipcRenderer, 'atlas-service-signed-out', onSignedOut);
  }

  // Restore the sign-in state when plugin is activated
  void store.dispatch(restoreSignInState());

  return { store, deactivate: cleanup };
}

export function configureStore({ atlasAuthService }: AtlasAuthPluginServices) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasAuthService }))
  );
  return store;
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;
