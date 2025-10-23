import React, { type PropsWithChildren, useRef } from 'react';
import { type UIMessage } from './@ai-sdk/react/use-chat';
import { Chat } from './@ai-sdk/react/chat-react';
import { createContext, useContext } from 'react';
import {
  createServiceLocator,
  registerCompassPlugin,
} from '@mongodb-js/compass-app-registry';
import {
  atlasAuthServiceLocator,
  type AtlasService,
  atlasServiceLocator,
} from '@mongodb-js/atlas-service/provider';
import { DocsProviderTransport } from './docs-provider-transport';
import { useDrawerActions } from '@mongodb-js/compass-components';
import {
  buildConnectionErrorPrompt,
  buildExplainPlanPrompt,
  buildProactiveInsightsPrompt,
  type EntryPointMessage,
  type ProactiveInsightsContext,
} from './prompts';
import {
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';
import {
  createLoggerLocator,
  type Logger,
} from '@mongodb-js/compass-logging/provider';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import {
  telemetryLocator,
  type TrackFunction,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import { atlasAiServiceLocator } from '@mongodb-js/compass-generative-ai/provider';
import { buildConversationInstructionsPrompt } from './prompts';
import { createOpenAI } from '@ai-sdk/openai';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

export type AssistantMessage = UIMessage & {
  metadata?: {
    /** The text to display instead of the message text. */
    displayText?: string;
    /** Whether to persist the message after chat clearing.
     *  Used for warning messages in cases like using non-genuine MongoDB.
     */
    isPermanent?: boolean;
    /** The source of the message (i.e. the entry point used) */
    source?: 'explain plan' | 'performance insights' | 'connection error';
    /** Information for confirmation messages. */
    confirmation?: {
      description: string;
      state: 'confirmed' | 'rejected' | 'pending';
    };
    /** Overrides the default sent instructions for the assistant for this message. */
    instructions?: string;
    /** Excludes history if this message is the last message being sent */
    sendWithoutHistory?: boolean;
  };
};

type AssistantContextType = Chat<AssistantMessage>;

export const AssistantContext = createContext<AssistantContextType | null>(
  null
);

type SendMessage = Parameters<Chat<AssistantMessage>['sendMessage']>[0];
type SendOptions = Parameters<Chat<AssistantMessage>['sendMessage']>[1];

type AssistantActionsContextType = {
  interpretExplainPlan?: ({
    namespace,
    explainPlan,
    operationType,
  }: {
    namespace: string;
    explainPlan: string;
    operationType: 'query' | 'aggregation';
  }) => void;
  interpretConnectionError?: ({
    connectionInfo,
    error,
  }: {
    connectionInfo: ConnectionInfo;
    error: Error;
  }) => void;
  tellMoreAboutInsight?: (context: ProactiveInsightsContext) => void;
  ensureOptInAndSend?: (
    message: SendMessage,
    options: SendOptions,
    callback: () => void
  ) => Promise<void>;
};

type AssistantActionsType = Omit<
  AssistantActionsContextType,
  'ensureOptInAndSend'
> & {
  getIsAssistantEnabled: () => boolean;
};

export const AssistantActionsContext =
  createContext<AssistantActionsContextType>({
    interpretExplainPlan: () => {},
    interpretConnectionError: () => {},
    tellMoreAboutInsight: () => {},
    ensureOptInAndSend: async () => {},
  });

export function useAssistantActions(): AssistantActionsType {
  const actions = useContext(AssistantActionsContext);
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const isAssistantFlagEnabled = usePreference('enableAIAssistant');
  const isPerformanceInsightEntrypointsEnabled = usePreference(
    'enablePerformanceInsightsEntrypoints'
  );

  if (!isAIFeatureEnabled || !isAssistantFlagEnabled) {
    return {
      getIsAssistantEnabled: () => false,
    };
  }

  const {
    interpretExplainPlan,
    interpretConnectionError,
    tellMoreAboutInsight,
  } = actions;

  return {
    interpretExplainPlan,
    interpretConnectionError,
    tellMoreAboutInsight: isPerformanceInsightEntrypointsEnabled
      ? tellMoreAboutInsight
      : undefined,
    getIsAssistantEnabled: () => true,
  };
}

export const compassAssistantServiceLocator = createServiceLocator(() => {
  const actions = useAssistantActions();

  const interpretConnectionErrorRef = useRef(actions.interpretConnectionError);
  interpretConnectionErrorRef.current = actions.interpretConnectionError;

  const getIsAssistantEnabledRef = useRef(actions.getIsAssistantEnabled);
  getIsAssistantEnabledRef.current = actions.getIsAssistantEnabled;

  return {
    interpretConnectionError: (options: {
      connectionInfo: ConnectionInfo;
      error: Error;
    }) => interpretConnectionErrorRef.current?.(options),
    getIsAssistantEnabled: () => {
      return getIsAssistantEnabledRef.current();
    },
  };
}, 'compassAssistantLocator');

export type CompassAssistantService = {
  interpretConnectionError: (options: {
    connectionInfo: ConnectionInfo;
    error: Error;
  }) => void;
  getIsAssistantEnabled: () => boolean;
};

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    appNameForPrompt: string;
    chat: Chat<AssistantMessage>;
    atlasAiService: AtlasAiService;
  }>
> = ({ chat, atlasAiService, children }) => {
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();

  const createEntryPointHandler = useRef(function <T>(
    entryPointName:
      | 'explain plan'
      | 'performance insights'
      | 'connection error',
    builder: (props: T) => EntryPointMessage
  ) {
    return (props: T) => {
      if (!assistantActionsContext.current.ensureOptInAndSend) {
        return;
      }

      const { prompt, metadata } = builder(props);
      void assistantActionsContext.current.ensureOptInAndSend(
        {
          text: prompt,
          metadata: {
            ...metadata,
            source: entryPointName,
          },
        },
        {},
        () => {
          openDrawer(ASSISTANT_DRAWER_ID);

          track('Assistant Entry Point Used', {
            source: entryPointName,
          });
        }
      );
    };
  }).current;
  const assistantActionsContext = useRef<AssistantActionsContextType>({
    interpretExplainPlan: createEntryPointHandler(
      'explain plan',
      buildExplainPlanPrompt
    ),
    interpretConnectionError: createEntryPointHandler(
      'connection error',
      buildConnectionErrorPrompt
    ),
    tellMoreAboutInsight: createEntryPointHandler(
      'performance insights',
      buildProactiveInsightsPrompt
    ),
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

      if (chat.status === 'streaming') {
        await chat.stop();
      }

      await chat.sendMessage(message, options);
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
      appNameForPrompt,
      chat,
      atlasAiService,
      children,
    }: PropsWithChildren<{
      appNameForPrompt: string;
      originForPrompt: string;
      chat?: Chat<AssistantMessage>;
      atlasAiService?: AtlasAiService;
    }>) => {
      if (!chat) {
        throw new Error('Chat was not provided by the state');
      }
      if (!atlasAiService) {
        throw new Error('atlasAiService was not provided by the state');
      }
      return (
        <AssistantProvider
          appNameForPrompt={appNameForPrompt}
          chat={chat}
          atlasAiService={atlasAiService}
        >
          {children}
        </AssistantProvider>
      );
    },
    activate: (
      { chat: initialChat, originForPrompt, appNameForPrompt },
      { atlasService, atlasAiService, logger, track }
    ) => {
      const chat =
        initialChat ??
        createDefaultChat({
          originForPrompt,
          appNameForPrompt,
          atlasService,
          logger,
          track,
        });

      return {
        store: { state: { chat, atlasAiService } },
        deactivate: () => {},
      };
    },
  },
  {
    atlasService: atlasServiceLocator,
    atlasAiService: atlasAiServiceLocator,
    atlasAuthService: atlasAuthServiceLocator,
    track: telemetryLocator,
    logger: createLoggerLocator('COMPASS-ASSISTANT'),
  }
);

export function createDefaultChat({
  originForPrompt,
  appNameForPrompt,
  atlasService,
  logger,
  track,
  options,
}: {
  originForPrompt: string;
  appNameForPrompt: string;
  atlasService: AtlasService;
  logger: Logger;
  track: TrackFunction;
  options?: {
    transport: Chat<AssistantMessage>['transport'];
  };
}): Chat<AssistantMessage> {
  const initialBaseUrl = atlasService.assistantApiEndpoint();
  return new Chat({
    transport:
      options?.transport ??
      new DocsProviderTransport({
        origin: originForPrompt,
        instructions: buildConversationInstructionsPrompt({
          target: appNameForPrompt,
        }),
        model: createOpenAI({
          baseURL: initialBaseUrl,
          apiKey: '',
          fetch(url, init) {
            return globalThis.fetch(
              // The `baseUrl` can be dynamically changed, but `createOpenAI`
              // constructor doesn't allow us to change it after initial call.
              // Instead we're going to update it every time the fetch call
              // happens
              String(url).replace(
                initialBaseUrl,
                atlasService.assistantApiEndpoint()
              ),
              init
            );
          },
        }).responses('mongodb-chat-latest'),
      }),
    onError: (err: Error) => {
      logger.log.error(
        logger.mongoLogId(1_001_000_370),
        'Assistant',
        'Failed to send a message',
        { err }
      );
      track('Assistant Response Failed', {
        error_name: err.name,
      });
    },
  });
}
