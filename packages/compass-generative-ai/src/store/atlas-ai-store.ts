import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import signInReducer, {
  atlasServiceSignedOut,
  atlasServiceSignedIn,
  atlasServiceSignInTokenRefreshFailed,
} from './atlas-signin-reducer';
import optInReducer from './atlas-optin-reducer';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { AtlasAiService } from '../atlas-ai-service';
import type { PreferencesAccess } from 'compass-preferences-model';

let store: CompassGenerativeAIServiceStore;
export function getStore() {
  if (!store) {
    throw new Error('CompassGenerativeAIPlugin not activated');
  }
  return store;
}
const reducer = combineReducers({
  signIn: signInReducer,
  optIn: optInReducer,
});

export type RootState = ReturnType<typeof reducer>;

export type CompassGenerativeAIExtraArgs = {
  atlasAuthService: AtlasAuthService;
  atlasAiService: AtlasAiService;
  preferences: PreferencesAccess;
};
export function activatePlugin(
  _: Record<string, never>,
  services: CompassGenerativeAIExtraArgs,
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
    void store.dispatch(atlasServiceSignInTokenRefreshFailed());
  });
  return { store, deactivate: cleanup };
}

export function configureStore({
  atlasAuthService,
  atlasAiService,
  preferences,
}: CompassGenerativeAIExtraArgs) {
  const store = createStore(
    reducer,
    applyMiddleware(
      thunk.withExtraArgument({ atlasAuthService, atlasAiService, preferences })
    )
  );
  return store;
}

export type CompassGenerativeAIServiceStore = ReturnType<typeof configureStore>;
