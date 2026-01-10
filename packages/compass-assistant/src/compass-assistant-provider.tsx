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
import {
  useCurrentValueRef,
  useDrawerActions,
  useInitialValue,
} from '@mongodb-js/compass-components';
import {
  buildConnectionErrorPrompt,
  buildContextPrompt,
  buildExplainPlanPrompt,
  buildProactiveInsightsPrompt,
  type EntryPointMessage,
  type ProactiveInsightsContext,
} from './prompts';
import {
  type PreferencesAccess,
  preferencesLocator,
  useIsAIFeatureEnabled,
  usePreference,
} from 'compass-preferences-model/provider';
import {
  createLoggerLocator,
  type Logger,
} from '@mongodb-js/compass-logging/provider';
import { type ConnectionInfo } from '@mongodb-js/connection-info';
import {
  telemetryLocator,
  type TrackFunction,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import type {
  AtlasAiService,
  ToolsController,
  ToolGroup,
} from '@mongodb-js/compass-generative-ai/provider';
import {
  atlasAiServiceLocator,
  toolsControllerLocator,
} from '@mongodb-js/compass-generative-ai/provider';
import { buildConversationInstructionsPrompt } from './prompts';
import { createOpenAI } from '@ai-sdk/openai';
import type { ActiveConnectionInfo } from './assistant-global-state';
import {
  AssistantGlobalStateProvider,
  useAssistantGlobalState,
} from './assistant-global-state';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import type { ToolSet, UIDataTypes, UIMessagePart, UITools } from 'ai';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

export type BasicConnectionInfo = {
  id: string;
  name: string;
};

export type AssistantMessage = UIMessage & {
  role?: 'user' | 'assistant' | 'system';
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
    /** Whether to send the current context along with the message if the context changed */
    sendContext?: boolean;

    /** Whether this is a message to the model that we don't want to display to the user*/
    isSystemContext?: boolean;

    /** Just enough info so we can tell which connection this message is related
     *  to (if any).
     */
    connectionInfo?: BasicConnectionInfo | null;
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
    tellMoreAboutInsight,
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

// Type guard to check if activeWorkspace has a connectionId property
function hasConnectionId(obj: unknown): obj is { connectionId: string } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'connectionId' in obj &&
    typeof (obj as any).connectionId === 'string'
  );
}

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    appNameForPrompt: string;
    chat: Chat<AssistantMessage>;
    atlasAiService: AtlasAiService;
    toolsController: ToolsController;
    preferences: PreferencesAccess;
  }>
> = ({ chat, atlasAiService, toolsController, preferences, children }) => {
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();

  const assistantGlobalStateRef = useCurrentValueRef(useAssistantGlobalState());

  const lastContextPromptRef = useRef<string | null>(null);

  const ensureOptInAndSend = useInitialValue(() => {
    return async function (
      message: SendMessage,
      options: SendOptions,
      callback: () => void
    ) {
      const {
        activeWorkspace,
        activeConnections,
        activeCollectionMetadata,
        activeCollectionSubTab,
      } = assistantGlobalStateRef.current;

      try {
        await atlasAiService.ensureAiFeatureAccess();
      } catch {
        // opt-in failed: just do nothing
        return;
      }

      // Call the callback to indicate that the opt-in was successful. A good
      // place to do tracking.
      callback();

      const { enableToolCalling, enableGenAIToolCalling } =
        preferences.getPreferences();

      if (enableToolCalling && enableGenAIToolCalling) {
        // Start the server once the first time both the feature flag and
        // setting are enabled, just before sending a message so that it will be
        // there when we call getActiveTools(). It is just some one-time setup
        // so we don't stop it again if the setting is turned off. It would just log
        // a lot of things every time. Main reason to lazy-start it is to avoid
        // all those logs appearing even if the feature flag and/or setting is
        // off.
        await toolsController.startServer();
      }

      // Automatically deny any pending tool approval requests in the chat before
      // sending the new message because ai sdk does not allow leaving them.
      let foundToolApprovalRequests = false;
      for (const message of chat.messages) {
        for (const part of message.parts) {
          if (partIsApprovalRequest(part)) {
            foundToolApprovalRequests = true;
            await chat.addToolApprovalResponse({
              id: part.approval.id,
              approved: false,
            });
          }
        }
      }

      if (foundToolApprovalRequests) {
        // Even though we await the promise above, if we immediately send
        // the message then ai sdk will throw because we haven't dealt with the
        // approval requests. Maybe because chat.addToolApprovalResponse() does
        // not always return a promise?
        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      if (chat.status === 'streaming') {
        await chat.stop();
      }

      const activeConnection =
        activeConnections.find((connInfo) => {
          return (
            hasConnectionId(activeWorkspace) &&
            connInfo.id === activeWorkspace.connectionId
          );
        }) ?? null;

      const contextPrompt = buildContextPrompt({
        activeWorkspace,
        activeConnection,
        activeCollectionMetadata,
        activeCollectionSubTab,
        enableToolCalling,
        enableGenAIToolCalling,
      });

      // use just the text so we have a stable reference to compare against
      const contextPromptText =
        contextPrompt.parts[0].type === 'text'
          ? contextPrompt.parts[0].text
          : '';

      const hasSystemContextMessage = chat.messages.some((message) => {
        return message.metadata?.isSystemContext;
      });

      const shouldSendContextPrompt =
        message?.metadata?.sendContext &&
        (!lastContextPromptRef.current ||
          lastContextPromptRef.current !== contextPromptText ||
          !hasSystemContextMessage);
      if (shouldSendContextPrompt) {
        lastContextPromptRef.current = contextPromptText;
        chat.messages = [...chat.messages, contextPrompt];
      }

      const query = assistantGlobalStateRef.current.currentQuery;
      const aggregation = assistantGlobalStateRef.current.currentAggregation;
      setToolsContext(toolsController, {
        activeConnection,
        connections: activeConnections,
        query,
        aggregation,
        enableToolCalling,
        enableGenAIToolCalling,
      });

      await chat.sendMessage(message, options);
    };
  });

  const createEntryPointHandler = useInitialValue(() => {
    return function <T>(
      entryPointName:
        | 'explain plan'
        | 'performance insights'
        | 'connection error',
      builder: (props: T) => EntryPointMessage
    ) {
      return function (props: T) {
        const { prompt, metadata } = builder(props);
        void ensureOptInAndSend(
          {
            text: prompt,
            metadata: {
              ...metadata,
              source: entryPointName,
              sendContext: true,
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
    };
  });

  const assistantActionsContext = useInitialValue<AssistantActionsContextType>({
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
    ensureOptInAndSend,
  });

  return (
    <AssistantContext.Provider value={chat}>
      <AssistantActionsContext.Provider value={assistantActionsContext}>
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
      toolsController,
      preferences,
      children,
    }: PropsWithChildren<{
      appNameForPrompt: string;
      originForPrompt: string;
      chat?: Chat<AssistantMessage>;
      atlasAiService?: AtlasAiService;
      toolsController?: ToolsController;
      preferences?: PreferencesAccess;
    }>) => {
      if (!chat) {
        throw new Error('Chat was not provided by the state');
      }
      if (!atlasAiService) {
        throw new Error('atlasAiService was not provided by the state');
      }
      if (!toolsController) {
        throw new Error('toolsController was not provided by the state');
      }
      if (!preferences) {
        throw new Error('preferences was not provided by the state');
      }
      return (
        <AssistantGlobalStateProvider>
          <AssistantProvider
            appNameForPrompt={appNameForPrompt}
            chat={chat}
            atlasAiService={atlasAiService}
            toolsController={toolsController}
            preferences={preferences}
          >
            {children}
          </AssistantProvider>
        </AssistantGlobalStateProvider>
      );
    },
    activate: (
      { chat: initialChat, originForPrompt, appNameForPrompt },
      {
        atlasService,
        atlasAiService,
        toolsController,
        preferences,
        logger,
        track,
      }
    ) => {
      const chat =
        initialChat ??
        createDefaultChat({
          originForPrompt,
          appNameForPrompt,
          atlasService,
          logger,
          track,
          getTools: () => toolsController.getActiveTools(),
        });

      return {
        store: {
          state: { chat, atlasAiService, toolsController, preferences },
        },
        deactivate: () => {},
      };
    },
  },
  {
    atlasService: atlasServiceLocator,
    atlasAiService: atlasAiServiceLocator,
    atlasAuthService: atlasAuthServiceLocator,
    toolsController: toolsControllerLocator,
    track: telemetryLocator,
    logger: createLoggerLocator('COMPASS-ASSISTANT'),
    preferences: preferencesLocator,
  }
);

export function createDefaultChat({
  originForPrompt,
  appNameForPrompt,
  atlasService,
  logger,
  track,
  options,
  getTools,
}: {
  originForPrompt: string;
  appNameForPrompt: string;
  atlasService: AtlasService;
  logger: Logger;
  track: TrackFunction;
  options?: {
    transport: Chat<AssistantMessage>['transport'];
  };
  getTools?: () => ToolSet;
}): Chat<AssistantMessage> {
  const initialBaseUrl = 'http://PLACEHOLDER_BASE_URL_TO_BE_REPLACED.invalid';
  return new Chat<AssistantMessage>({
    transport:
      options?.transport ??
      new DocsProviderTransport({
        origin: originForPrompt,
        getTools,
        instructions: buildConversationInstructionsPrompt({
          target: appNameForPrompt,
        }),
        model: createOpenAI({
          baseURL: initialBaseUrl,
          apiKey: '',
          fetch(url, init) {
            if (init?.body) {
              // TODO: Temporary hack to transform developer role to system role
              // before sending the request. Should be removed once our backend supports it.
              const body = JSON.parse(init?.body as string);
              body.input = body.input.map((message: any) => {
                if (message.role === 'developer') {
                  return {
                    ...message,
                    role: 'system',
                  };
                }
                return message;
              });
              init.body = JSON.stringify(body);
            }
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
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
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

export function setToolsContext(
  toolsController: ToolsController,
  {
    activeConnection,
    connections,
    query,
    aggregation,
    enableToolCalling,
    enableGenAIToolCalling,
  }: {
    activeConnection: ActiveConnectionInfo | null;
    connections: ActiveConnectionInfo[];
    query?: string | null;
    aggregation?: string | null;
    enableToolCalling?: boolean;
    enableGenAIToolCalling?: boolean;
  }
) {
  if (enableToolCalling) {
    const toolGroups = new Set<ToolGroup>([]);
    if (enableGenAIToolCalling) {
      toolGroups.add('compass');
      if (activeConnection) {
        toolGroups.add('db-read');
      }
    }
    toolsController.setActiveTools(toolGroups);
    toolsController.setContext({
      connections: connections.map((connection) => {
        if (!connection.connectOptions) {
          throw new Error(
            `Connection ${connection.id} is missing connectOptions`
          );
        }
        return {
          connectionId: connection.id,
          connectionString: connection.connectionOptions.connectionString,
          connectOptions: connection.connectOptions,
        };
      }),
      query: query || undefined,
      aggregation: aggregation || undefined,
    });
  } else {
    toolsController.setActiveTools(new Set([]));
    toolsController.setContext({
      connections: [],
      query: undefined,
      aggregation: undefined,
    });
  }
}

function partIsApprovalRequest(
  part: UIMessagePart<UIDataTypes, UITools>
): part is UIMessagePart<UIDataTypes, UITools> & { approval: { id: string } } {
  return (part as { state?: string }).state === 'approval-requested';
}
