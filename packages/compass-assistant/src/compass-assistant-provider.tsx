import React, { type PropsWithChildren, useRef } from 'react';
import { type UIMessage } from './@ai-sdk/react/use-chat';
import { Chat } from './@ai-sdk/react/chat-react';
import { createContext, useContext } from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import { DocsProviderTransport } from './docs-provider-transport';
import { useDrawerActions } from '@mongodb-js/compass-components';
import { buildExplainPlanPrompt } from './prompts';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

type AssistantContextType = Chat<UIMessage>;

export const AssistantContext = createContext<AssistantContextType | null>(
  null
);

type AssistantActionsContextType = {
  interpretExplainPlan: (explainPlan: string) => void;
};
export const AssistantActionsContext =
  createContext<AssistantActionsContextType>({
    interpretExplainPlan: () => {},
  });

export function useAssistantActions(): AssistantActionsContextType {
  return useContext(AssistantActionsContext);
}

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    chat: Chat<UIMessage>;
  }>
> = ({ chat, children }) => {
  const assistantActionsContext = useRef<AssistantActionsContextType>({
    interpretExplainPlan: (explainPlan: string) => {
      openDrawer(ASSISTANT_DRAWER_ID);
      void chat.sendMessage({
        text: buildExplainPlanPrompt(explainPlan),
      });
    },
  });
  const { openDrawer } = useDrawerActions();

  return (
    <AssistantContext.Provider value={chat}>
      <AssistantActionsContext.Provider value={assistantActionsContext.current}>
        {children}
      </AssistantActionsContext.Provider>
    </AssistantContext.Provider>
  );
};

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
