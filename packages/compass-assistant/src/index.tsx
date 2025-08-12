import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { AssistantProvider } from './assistant-provider';
import { Chat } from './@ai-sdk/react/chat-react';
import { docsProviderTransport } from './docs-provider-transport';

const CompassAssistantProvider = registerCompassPlugin(
  {
    name: 'CompassAssistant',
    component: AssistantProvider,
    activate: () => {
      const chat = new Chat({ transport: docsProviderTransport });
      return {
        store: { state: { chat } },
        deactivate: () => {},
      };
    },
  },
  {
    transport: () => docsProviderTransport,
  }
);

export { CompassAssistantProvider };

// Export hooks and components for external use
export { AssistantProvider, useAssistantActions } from './assistant-provider';
