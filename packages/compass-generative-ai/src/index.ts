import type { ActivateHelpers } from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';

import { AtlasAiPlugin } from './components';
import { atlasAiServiceLocator } from './provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import type {
  CompassGenerativeAIServiceStore,
  CompassGenerativeAIExtraArgs,
} from './store/atlas-ai-store';
import { configureStore } from './store/atlas-ai-store';
import {
  atlasServiceSignedOut,
  atlasServiceSignedIn,
  atlasServiceSignInTokenRefreshFailed,
} from './store/atlas-signin-reducer';
import type { AtlasAiPluginProps } from './components/plugin';

let store: CompassGenerativeAIServiceStore;

export function activatePlugin(
  _initialProps: AtlasAiPluginProps,
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

export const CompassGenerativeAIPlugin = registerHadronPlugin(
  {
    name: 'CompassGenerativeAI',
    component: AtlasAiPlugin,
    activate: activatePlugin,
  },
  {
    atlasAuthService: atlasAuthServiceLocator,
    atlasAiService: atlasAiServiceLocator,
    preferences: preferencesLocator,
  }
);

export {
  AIExperienceEntry,
  GenerativeAIInput,
  createAIPlaceholderHTMLPlaceholder,
} from './components';
