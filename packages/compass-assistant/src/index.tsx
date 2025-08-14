import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { AssistantProvider } from './assistant-provider';
import { Chat } from './@ai-sdk/react/chat-react';
import { DocsProviderTransport } from './docs-provider-transport';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import type { PropsWithChildren } from 'react';
import type { UIMessage } from 'ai';
import React from 'react';

export const CompassAssistantProvider = registerCompassPlugin(
  {
    name: 'CompassAssistant',
    component: ({
      chat,
      children,
    }: PropsWithChildren<{
      chat?: Chat<UIMessage>;
    }>) => {
      if (!chat) {
        throw new Error('Chat was not provided by the state');
      }
      return <AssistantProvider chat={chat}>{children}</AssistantProvider>;
    },
    activate: (initialProps, { atlasService }) => {
      const chat = new Chat({
        transport: new DocsProviderTransport({
          baseUrl: atlasService.assistantApiEndpoint(),
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

export { CompassAssistantDrawer } from './compass-assistant-drawer';
