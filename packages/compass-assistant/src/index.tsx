import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { AssistantProvider } from './assistant-provider';
import { Chat } from './@ai-sdk/react/chat-react';
import { DocsProviderTransport } from './docs-provider-transport';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';

const CompassAssistantProvider = registerCompassPlugin(
  {
    name: 'CompassAssistant',
    component: AssistantProvider,
    activate: (initialProps, { atlasService }) => {
      // TODO: We will temporarily default to the staging url until the docs
      // API is deployed to the production environment.
      const baseUrl = process.env.COMPASS_ASSISTANT_USE_ATLAS_SERVICE_URL
        ? atlasService.assistantApiEndpoint()
        : 'https://knowledge.staging.corp.mongodb.com/api/v1';
      const chat = new Chat({
        transport: new DocsProviderTransport({
          baseUrl,
        }),
      });
      return {
        store: { state: { chat } },
        deactivate: () => {},
      };
    },
  },
  {
    atlasService: atlasServiceLocator,
  }
);

export { CompassAssistantProvider };

// Export hooks and components for external use
export { AssistantProvider, useAssistantActions } from './assistant-provider';
