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
import {
  buildConnectionErrorPrompt,
  buildExplainPlanPrompt,
  buildProactiveInsightsPrompt,
  type EntryPointMessage,
  type ProactiveInsightsContext,
} from './prompts';
import { usePreference } from 'compass-preferences-model/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useAtlasAiServiceContext } from '@mongodb-js/compass-generative-ai/provider';

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

type SendMessage = Parameters<Chat<AssistantMessage>['sendMessage']>[0];
type SendOptions = Parameters<Chat<AssistantMessage>['sendMessage']>[1];

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
  clearChat: () => void;
  tellMoreAboutInsight: (context: ProactiveInsightsContext) => void;
  ensureOptInAndSend: (
    message: SendMessage,
    options: SendOptions,
    callback: () => void
  ) => Promise<void>;
};
export const AssistantActionsContext =
  createContext<AssistantActionsContextType>({
    interpretExplainPlan: () => {},
    interpretConnectionError: () => {},
    tellMoreAboutInsight: () => {},
    clearChat: () => {},
    ensureOptInAndSend: async () => {},
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
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const atlasAiService = useAtlasAiServiceContext();
  const createEntryPointHandler = useRef(function <T>(
    entryPointName:
      | 'explain plan'
      | 'performance insights'
      | 'connection error',
    builder: (props: T) => EntryPointMessage
  ) {
    return (props: T) => {
      const { prompt, displayText } = builder(props);
      void assistantActionsContext.current.ensureOptInAndSend(
        { text: prompt, metadata: { displayText } },
        {},
        () => {
          openDrawer(ASSISTANT_DRAWER_ID);

          track('Assistant Entry Point Used', {
            source: entryPointName,
          });
        }
      );
    };
  });
  const assistantActionsContext = useRef<AssistantActionsContextType>({
    interpretExplainPlan: createEntryPointHandler.current(
      'explain plan',
      buildExplainPlanPrompt
    ),
    interpretConnectionError: createEntryPointHandler.current(
      'connection error',
      buildConnectionErrorPrompt
    ),
    tellMoreAboutInsight: createEntryPointHandler.current(
      'performance insights',
      buildProactiveInsightsPrompt
    ),
    clearChat: () => {
      chat.messages = [];
    },
    ensureOptInAndSend: async (
      message: SendMessage,
      options: SendOptions,
      callback: () => void
    ) => {
      try {
        await atlasAiService.ensureAiFeatureAccess();
      } catch {
        // opt-in failed: just do nothing
        return;
      }

      // Call the callback to indicate that the opt-in was successful. A good
      // place to do tracking.
      callback();

      await chat.sendMessage(message);
    },
  });

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
    activate: (initialProps, { atlasService, logger }) => {
      const chat = new Chat({
        transport: new DocsProviderTransport({
          baseUrl: atlasService.assistantApiEndpoint(),
        }),
        onError: (err) => {
          logger.log.error(
            logger.mongoLogId(1_001_000_370),
            'Assistant',
            'Failed to send a message',
            { err }
          );
        },
      });
      return {
        store: { state: { chat } },
        deactivate: () => {},
      };
    },
  },
  {
    atlasService: atlasServiceLocator,
    logger: createLoggerLocator('COMPASS-ASSISTANT'),
  }
);
