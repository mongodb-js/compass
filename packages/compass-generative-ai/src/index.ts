import { registerHadronPlugin } from 'hadron-app-registry';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';

import { activatePlugin } from './store/atlas-ai-store';
import { AtlasAiPlugin } from './components';
import { atlasAiServiceLocator } from './provider';

export const CompassGenerativeAIPlugin = registerHadronPlugin(
  {
    name: 'CompassGenerativeAI',
    component: AtlasAiPlugin,
    activate: activatePlugin,
  },
  {
    atlasAuthService: atlasAuthServiceLocator,
    atlasAiService: atlasAiServiceLocator,
  }
);

export {
  AIExperienceEntry,
  GenerativeAIInput,
  createAIPlaceholderHTMLPlaceholder,
} from './components';
