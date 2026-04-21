import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';
import { AtlasAiPlugin } from './components';
import { atlasAiServiceLocator } from './provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { activatePlugin } from './store/atlas-ai-store';

export const CompassGenerativeAIPlugin = registerCompassPlugin(
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

export {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';

export type {
  MockDataSchemaRequest,
  MockDataSchemaRawField,
  MockDataSchemaToolOutput,
} from './atlas-ai-service';

export { mockDataSchemaToolSchema } from './atlas-ai-service';

export { READ_ONLY_DATABASE_TOOLS, AVAILABLE_TOOLS } from './available-tools';

// Exporting these in one place so we can track the same versions across the app
// and tests. If we just track latest, then future models could become the
// latest model and they could break backwards compatibility which will break
// released versions of Compass. By pinning to specific versions here, we can
// control when we want to update to newer models and we can make sure that
// we're using versions that work with the bundled versions of ai sdk libraries.
export const AI_MODEL_CHAT_VERSION = 'mongodb-chat-2.1-mini-reasoning';
export const AI_MODEL_SLIM_VERSION = 'mongodb-slim-2.1-mini';
