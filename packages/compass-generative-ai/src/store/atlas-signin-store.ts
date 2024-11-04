import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  atlasServiceSignedOut,
  atlasServiceSignedIn,
  atlasServiceTokenRefreshFailed,
} from './atlas-signin-reducer';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
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
  { cleanup }: ActivateHelpers
) {
  store = configureStore(services);

  services.atlasAuthService.on('signed-in', () => {
    void store.dispatch(atlasServiceSignedIn());
  });

  services.atlasAuthService.on('signed-out', () => {
    void store.dispatch(atlasServiceSignedOut());
  });

  services.atlasAuthService.on('token-refresh-failed', () => {
    void store.dispatch(atlasServiceTokenRefreshFailed());
  });

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
