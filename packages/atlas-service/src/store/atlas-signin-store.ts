import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { AtlasUserConfig } from '../renderer';
import reducer, {
  signedOut,
  tokenRefreshFailed,
  userConfigChanged,
} from './atlas-signin-reducer';
import { atlasAuthServiceLocator, type AtlasAuthService } from '../provider';
import { ipcRenderer } from 'hadron-ipc';

export function configureStore({
  atlasAuthService,
}: {
  atlasAuthService: AtlasAuthService;
}) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasAuthService }))
  );

  // We might not be in electorn environment
  if (ipcRenderer) {
    ipcRenderer.on('atlas-service-token-refresh-failed', () => {
      getStore().dispatch(tokenRefreshFailed());
    });

    ipcRenderer.on('atlas-service-signed-out', () => {
      getStore().dispatch(signedOut());
    });

    ipcRenderer.on(
      'atlas-service-user-config-changed',
      (_evt, newConfig: AtlasUserConfig) => {
        getStore().dispatch(userConfigChanged(newConfig));
      }
    );
  }

  return store;
}

export type AtlasServiceStore = ReturnType<typeof configureStore>;

let store: AtlasServiceStore;

export function getStore() {
  store ??= configureStore({
    atlasAuthService: atlasAuthServiceLocator(),
  });
  return store;
}
