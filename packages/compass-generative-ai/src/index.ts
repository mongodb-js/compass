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
  MockDataSchemaRequestShape,
  MockDataSchemaRawFieldMappingShape,
} from './atlas-ai-service';

export {
  AtlasAiServiceInvalidInputError,
  AtlasAiServiceApiResponseParseError,
} from './atlas-ai-errors';

export type {
  MockDataSchemaRequest,
  MockDataSchemaRawFieldMapping,
  MockDataSchemaRawField,
} from './atlas-ai-service';
