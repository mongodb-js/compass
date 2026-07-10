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
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';

export type {
  MockDataSchemaRequest,
  MockDataSchemaRawField,
  MockDataSchemaToolOutput,
} from './atlas-ai-service';

export { READ_ONLY_DATABASE_TOOLS, getAvailableTools } from './available-tools';
export { AI_MODEL_CHAT_VERSION, AI_MODEL_SLIM_VERSION } from './model-version';
