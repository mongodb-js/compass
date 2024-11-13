import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import signInReducer, {
  atlasServiceSignedOut,
  atlasServiceSignedIn,
  //atlasServiceSignInTokenRefreshFailed,
} from './atlas-signin-reducer';
import optInReducer, {/*atlasAiServiceOptedIn,*/ atlasServiceOptInTokenRefreshFailed } from './atlas-optin-reducer';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { AtlasAiService } from '../atlas-ai-service';

let store: CompassGenerativeAIServiceStore;
export function getStore() {
  if (!store) {
    throw new Error('CompassGenerativeAIPlugin not activated');
  }
  return store;
}
const reducer = combineReducers({
  signInReducer,
  optInReducer
});

export type CompassGenerativeAIPluginServices = {
  atlasAuthService: AtlasAuthService;
  atlasAiService: AtlasAiService
};
export function activatePlugin(
  _: Record<string, never>,
  services: CompassGenerativeAIPluginServices,
  { cleanup }: ActivateHelpers
) {
  store = configureStore(services);
  console.log(services.atlasAiService)
  services.atlasAuthService.on('signed-in', () => {
    void store.dispatch(atlasServiceSignedIn());
  });

  services.atlasAuthService.on('signed-out', () => {
    void store.dispatch(atlasServiceSignedOut());
  });

  services.atlasAuthService.on('token-refresh-failed', () => {
    void store.dispatch(atlasServiceOptInTokenRefreshFailed());
  });
  return { store, deactivate: cleanup };
}

export function configureStore({
  atlasAuthService, atlasAiService
}: CompassGenerativeAIPluginServices) {
  const store = createStore(
    reducer,
    applyMiddleware(thunk.withExtraArgument({ atlasAuthService, atlasAiService }))
  );
  return store;
}

export type CompassGenerativeAIServiceStore = ReturnType<typeof configureStore>;
