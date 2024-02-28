import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { AtlasUserConfig } from '../renderer';
import reducer, {
  restoreSignInState,
  signedOut,
  tokenRefreshFailed,
  userConfigChanged,
} from './atlas-signin-reducer';
import { type AtlasAuthService } from '../provider';
import { ipcRenderer } from 'hadron-ipc';
import type { ActivateHelpers } from 'hadron-app-registry';

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
  { on, addCleanup, cleanup }: ActivateHelpers
) {
  store = configureStore(services);

  const onSignedOut = () => store.dispatch(signedOut);
  const onTokenRefreshFailed = () => store.dispatch(tokenRefreshFailed);
  const onUserConfigChanged = (_evt: unknown, newConfig: AtlasUserConfig) =>
    store.dispatch(userConfigChanged(newConfig));

  if (ipcRenderer) {
    on(ipcRenderer, 'atlas-service-token-refresh-failed', onSignedOut);
    on(ipcRenderer, 'atlas-service-signed-out', onTokenRefreshFailed);
    on(ipcRenderer, 'atlas-service-user-config-changed', onUserConfigChanged);
  }

  addCleanup(() => {
    if (ipcRenderer) {
      ipcRenderer.off(
        'atlas-service-token-refresh-failed',
        onTokenRefreshFailed
      );
      ipcRenderer.off('atlas-service-signed-out', onSignedOut);
      ipcRenderer.off('atlas-service-user-config-changed', onUserConfigChanged);
    }
  });

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
