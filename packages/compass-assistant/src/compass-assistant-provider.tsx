import React, { type PropsWithChildren, useRef } from 'react';
import { type UIMessage } from './@ai-sdk/react/use-chat';
import { Chat } from './@ai-sdk/react/chat-react';
import { createContext, useContext } from 'react';
import {
  createServiceLocator,
  registerCompassPlugin,
} from '@mongodb-js/compass-app-registry';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import { DocsProviderTransport } from './docs-provider-transport';
import { useDrawerActions } from '@mongodb-js/compass-components';
import { buildConnectionErrorPrompt, buildExplainPlanPrompt } from './prompts';
import { usePreference } from 'compass-preferences-model/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

export type AssistantMessage = UIMessage & {
  metadata?: {
    /** The text to display instead of the message text. */
    displayText?: string;
  };
};

type AssistantContextType = Chat<AssistantMessage>;

export const AssistantContext = createContext<AssistantContextType | null>(
  null
);

type AssistantActionsContextType = {
  interpretExplainPlan: ({
    namespace,
    explainPlan,
  }: {
    namespace: string;
    explainPlan: string;
  }) => void;
  interpretConnectionError: ({
    connectionInfo,
    error,
  }: {
    connectionInfo: ConnectionInfo;
    error: Error;
  }) => void;
};
export const AssistantActionsContext =
  createContext<AssistantActionsContextType>({
    interpretExplainPlan: () => {},
    interpretConnectionError: () => {},
  });

export function useAssistantActions(): AssistantActionsContextType & {
  isAssistantEnabled: boolean;
} {
  const isAssistantEnabled = usePreference('enableAIAssistant');

  return {
    ...useContext(AssistantActionsContext),
    isAssistantEnabled,
  };
}

export const compassAssistantServiceLocator = createServiceLocator(function () {
  const { isAssistantEnabled, ...actions } = useAssistantActions();

  const assistantEnabledRef = useRef(isAssistantEnabled);
  assistantEnabledRef.current = isAssistantEnabled;

  return {
    ...actions,
    getIsAssistantEnabled() {
      return assistantEnabledRef.current;
    },
  };
}, 'compassAssistantLocator');

export type CompassAssistantService = ReturnType<
  typeof compassAssistantServiceLocator
>;

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    chat: Chat<AssistantMessage>;
  }>
> = ({ chat, children }) => {
  const assistantActionsContext = useRef<AssistantActionsContextType>({
    interpretExplainPlan: ({ explainPlan }) => {
      openDrawer(ASSISTANT_DRAWER_ID);
      const { prompt, displayText } = buildExplainPlanPrompt({
        explainPlan,
      });
      void chat.sendMessage(
        {
          text: prompt,
          metadata: {
            displayText,
          },
        },
        {}
      );
    },
    interpretConnectionError: ({ connectionInfo, error }) => {
      openDrawer(ASSISTANT_DRAWER_ID);

      // TODO: redact the connection string
      const connectionString =
        connectionInfo.connectionOptions.connectionString;
      const connectionError = error.toString(); // TODO
      console.log({ connectionString, connectionError });

      const { prompt, displayText } = buildConnectionErrorPrompt({
        connectionString,
        connectionError,
      });
      void chat.sendMessage(
        {
          text: prompt,
          metadata: {
            displayText,
          },
        },
        {}
      );
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
      chat?: Chat<AssistantMessage>;
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
