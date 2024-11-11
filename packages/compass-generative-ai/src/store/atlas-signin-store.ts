import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  atlasServiceSignedOut,
  atlasServiceSignedIn,
  atlasServiceTokenRefreshFailed,
} from './atlas-signin-reducer';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import type { ActivateHelpers } from 'hadron-app-registry';

let store: CompassGenerativeAIServiceStore;
export function getStore() {
  if (!store) {
    throw new Error('CompassGenerativeAIPlugin not activated');
  }
  return store;
}

export type CompassGenerativeAIPluginServices = {
  atlasAuthService: AtlasAuthService;
};
export function activatePlugin(
  _: Record<string, never>,
  services: CompassGenerativeAIPluginServices,
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

export function configureStore({
  atlasAuthService,
}: CompassGenerativeAIPluginServices) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasAuthService }))
  );
  return store;
}

export type CompassGenerativeAIServiceStore = ReturnType<typeof configureStore>;
