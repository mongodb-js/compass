import { registerHadronPlugin } from 'hadron-app-registry';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';

import { activatePlugin } from './store/atlas-signin-store';
import { AtlasSignIn } from './components';

export const CompassGenerativeAIPlugin = registerHadronPlugin(
  {
    name: 'CompassGenerativeAI',
    component: AtlasSignIn,
    activate: activatePlugin,
  },
  {
    atlasAuthService: atlasAuthServiceLocator,
  }
);

export {
  AIExperienceEntry,
  GenerativeAIInput,
  createAIPlaceholderHTMLPlaceholder,
} from './components';
