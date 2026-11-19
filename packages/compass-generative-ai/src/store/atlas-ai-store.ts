import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import type { PreferencesAccess } from '@mongodb-js/compass-preferences-model';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { AtlasAiService } from '../atlas-ai-service';
import type { AtlasAiPluginProps } from '../components/plugin';
import optInReducer from './atlas-optin-reducer';

export let store: CompassGenerativeAIServiceStore;

export function getStore() {
  if (!store) {
    throw new Error('CompassGenerativeAIPlugin not activated');
  }
  return store;
}
const reducer = combineReducers({
  optIn: optInReducer,
});

export type RootState = ReturnType<typeof reducer>;

export function activatePlugin(
  _initialProps: AtlasAiPluginProps,
  services: CompassGenerativeAIExtraArgs,
  { cleanup }: ActivateHelpers
) {
  store = configureStore(services);

  return { store, deactivate: cleanup };
}
export type CompassGenerativeAIExtraArgs = {
  atlasAuthService: AtlasAuthService;
  atlasAiService: AtlasAiService;
  preferences: PreferencesAccess;
};

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
