import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';
import { AtlasAiPlugin } from './components';
import { atlasAiServiceLocator } from './provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { activatePlugin } from './store/atlas-ai-store';
import { defaultParserOptions } from 'mongodb-mcp-server';

// TODO: Remove once mongodb-mcp-server is used.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parserOptions = defaultParserOptions;

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

export { MockDataSchemaResponseShape } from './atlas-ai-service';

export {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';

export type {
  MockDataSchemaRequest,
  MockDataSchemaRawField,
  MockDataSchemaResponse,
} from './atlas-ai-service';
