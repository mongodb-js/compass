import React, { type PropsWithChildren, useRef } from 'react';
import { type UIMessage } from './@ai-sdk/react/use-chat';
import { Chat } from './@ai-sdk/react/chat-react';
import { createContext, useContext } from 'react';
import {
  createServiceLocator,
  registerCompassPlugin,
  type ActivateHelpers,
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
  buildDiagnoseSearchStagePrompt,
  buildExplainPlanPrompt,
  buildProactiveInsightsPrompt,
  buildAnalyzeOutputPrompt,
  type DiagnoseSearchStageContext,
  type EntryPointMessage,
  type ProactiveInsightsContext,
  type AnalyzeOutputContext,
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
import {
  getConnectionTitle,
  type ConnectionInfo,
} from '@mongodb-js/connection-info';
import {
  telemetryLocator,
  type TrackFunction,
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
import type {
  ActiveConnectionInfo,
  GlobalState,
} from './assistant-global-state';
import {
  AssistantGlobalStateProvider,
  useAssistantGlobalState,
} from './assistant-global-state';
import { lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai';
import type { ToolSet } from 'ai';
import type {
  CollectionSubtab,
  WorkspaceTab,
} from '@mongodb-js/workspace-info';
import { UUID } from 'bson';
import {
  getHashedActiveUserId,
  partIsApprovalRequest,
  stopChat,
} from './utils';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import type { Action, AnyAction } from 'redux';
import { connect } from 'react-redux';
import { AI_MODEL_CHAT_VERSION } from '@mongodb-js/compass-generative-ai/provider';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

export type BasicConnectionInfo = {
  id: string;
  name: string;
};

export type ActiveTabType = CollectionSubtab | WorkspaceTab['type'] | null;

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
    source?:
      | 'explain plan'
      | 'performance insights'
      | 'connection error'
      | 'follow-up prompt'
      | 'analyze output'
      | 'search stage diagnose';
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
    /** Whether to enable or disable storage of this message in chatapi. */
    disableStorage?: boolean;
    /** SHA-256 hashed User ID. */
    analyticsId?: string;
    /** The request ID associated with this message. */
    requestId?: string;
    /** Tool call IDs that have already had their connection ID registered. */
    registeredToolCallIds?: string[];
  };
};

type AssistantContextType = Chat<AssistantMessage>;

export const AssistantContext = createContext<AssistantContextType | null>(
  null
);

const AssistantProjectContext = createContext<string | undefined>(undefined);

export function useAssistantProjectId(): string | undefined {
  return useContext(AssistantProjectContext);
}

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
  interpretAnalyzeOutput?: (context: AnalyzeOutputContext) => void;
  diagnoseSearchStage?: (context: DiagnoseSearchStageContext) => void;
  ensureOptInAndSend?: (
    message: SendMessage,
    options: SendOptions,
    callback: (options: {
      requestId: string;
      connectionInfo?: BasicConnectionInfo;
    }) => void
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
    interpretAnalyzeOutput: () => {},
    diagnoseSearchStage: () => {},
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
    interpretAnalyzeOutput,
    diagnoseSearchStage,
  } = actions;

  return {
    interpretExplainPlan,
    interpretConnectionError,
    tellMoreAboutInsight,
    interpretAnalyzeOutput,
    diagnoseSearchStage,
    getIsAssistantEnabled: () => true,
  };
}

export const compassAssistantServiceLocator = createServiceLocator(() => {
  const actions = useAssistantActions();

  const interpretExplainPlanRef = useRef(actions.interpretExplainPlan);
  interpretExplainPlanRef.current = actions.interpretExplainPlan;

  const interpretConnectionErrorRef = useRef(actions.interpretConnectionError);
  interpretConnectionErrorRef.current = actions.interpretConnectionError;

  const getIsAssistantEnabledRef = useRef(actions.getIsAssistantEnabled);
  getIsAssistantEnabledRef.current = actions.getIsAssistantEnabled;

  return {
    interpretExplainPlan: (options: {
      namespace: string;
      explainPlan: string;
      operationType: 'query' | 'aggregation';
    }) => interpretExplainPlanRef.current?.(options),
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
  interpretExplainPlan: (options: {
    namespace: string;
    explainPlan: string;
    operationType: 'query' | 'aggregation';
  }) => void;
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

// Redux store types

export type AssistantState = Record<string, never>;

type AssistantExtraArgs = {
  chat: Chat<AssistantMessage>;
  atlasAiService: AtlasAiService;
  toolsController: ToolsController;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
  lastContextPromptRef: { current: string | null };
};

export type AssistantThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  AssistantState,
  AssistantExtraArgs,
  A
>;

const reducer = (
  state: AssistantState = {} as AssistantState
): AssistantState => state;

// Thunk action for the core send logic
export function ensureOptInAndSendThunk(
  _message: SendMessage,
  options: SendOptions,
  callback: (options: {
    requestId: string;
    connectionInfo?: BasicConnectionInfo;
  }) => void,
  globalState: GlobalState
): AssistantThunkAction<Promise<void>> {
  return async (_dispatch, _getState, extra) => {
    const {
      activeWorkspace,
      activeConnections,
      activeCollectionMetadata,
      activeCollectionSubTab,
    } = globalState;
    const {
      chat,
      atlasAiService,
      toolsController,
      preferences,
      logger,
      track,
      lastContextPromptRef,
    } = extra;

    try {
      await atlasAiService.ensureAiFeatureAccess();
    } catch {
      // opt-in failed: just do nothing
      return;
    }

    const activeConnection =
      activeConnections.find((connInfo) => {
        return (
          hasConnectionId(activeWorkspace) &&
          connInfo.id === activeWorkspace.connectionId
        );
      }) ?? null;

    const requestId = new UUID().toString();
    const connectionInfo = activeConnection
      ? {
          id: activeConnection.id,
          name: getConnectionTitle(activeConnection),
        }
      : undefined;

    // Call the callback to indicate that the opt-in was successful. A good
    // place to do tracking.
    callback({ requestId, connectionInfo });

    const prefs = preferences.getPreferences();

    const enableToolCalling = prefs.enableToolCalling;
    const enableGenAIToolCalling =
      prefs.enableGenAIToolCallingAtlasProject && prefs.enableGenAIToolCalling;

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

    // Automatically deny any pending tool approval requests in the chat
    // before sending the new message because the assistant does not allow
    // leaving them
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
      await stopChat(chat);
    }

    const contextPrompt = buildContextPrompt({
      activeWorkspace,
      activeConnection,
      activeCollectionMetadata,
      activeCollectionSubTab,
      enableGenAIToolCalling: enableToolCalling && enableGenAIToolCalling,
    });

    // use just the text so we have a stable reference to compare against
    const contextPromptText =
      contextPrompt.parts[0].type === 'text' ? contextPrompt.parts[0].text : '';

    const hasSystemContextMessage = chat.messages.some((message) => {
      return message.metadata?.isSystemContext;
    });

    const message = _message
      ? {
          ..._message,
          metadata: {
            ..._message.metadata,
            disableStorage: activeConnections.some(
              (info) => info.connectionOptions.fleOptions
            ),
            connectionInfo,
            requestId,
            analyticsId: await getHashedActiveUserId(preferences, logger),
          },
        }
      : undefined;

    const shouldSendContextPrompt =
      message?.metadata?.sendContext &&
      (!lastContextPromptRef.current ||
        lastContextPromptRef.current !== contextPromptText ||
        !hasSystemContextMessage);
    if (shouldSendContextPrompt) {
      lastContextPromptRef.current = contextPromptText;
      chat.messages = [...chat.messages, contextPrompt];
    }

    const query = globalState.currentQuery;
    const pipeline = globalState.currentPipeline;
    const activeTab: ActiveTabType = activeWorkspace
      ? activeCollectionSubTab || activeWorkspace.type
      : null;
    setToolsContext(toolsController, {
      enableTelemetry: prefs.trackUsageStatistics,
      maxTimeMS: prefs.maxTimeMS,
      activeConnection,
      connections: activeConnections,
      query,
      pipeline,
      enableToolCalling,
      enableGenAIToolCalling,
      activeTab,
    });

    try {
      await chat.sendMessage(message, options);
      track(
        'Assistant Response Generated',
        {
          request_id: requestId,
        },
        connectionInfo
      );
    } catch (err) {
      logger.log.error(
        logger.mongoLogId(1_001_000_418),
        'Assistant',
        'Failed to generate response',
        { err }
      );
      track(
        'Assistant Response Failed',
        {
          error_name: (err as Error).name,
          request_id: requestId,
        },
        connectionInfo
      );
      throw err;
    }
  };
}

// Thunk action for entry point handlers
function handleEntryPoint<T>(
  entryPointName:
    | 'explain plan'
    | 'performance insights'
    | 'connection error'
    | 'analyze output'
    | 'search stage diagnose',
  builder: (props: T) => EntryPointMessage,
  props: T,
  globalState: GlobalState,
  openDrawer: (id: string) => void
): AssistantThunkAction<void> {
  return (dispatch, _getState, { track }) => {
    const { prompt, metadata } = builder(props);
    void dispatch(
      ensureOptInAndSendThunk(
        {
          text: prompt,
          metadata: {
            ...metadata,
            source: entryPointName,
            sendContext: true,
          },
        },
        {},
        ({ requestId, connectionInfo }) => {
          openDrawer(ASSISTANT_DRAWER_ID);

          track(
            'Assistant Entry Point Used',
            {
              source: entryPointName,
              request_id: requestId,
            },
            connectionInfo
          );
        },
        globalState
      )
    );
  };
}

// Individual entry point action creators for connect mapDispatchToProps
function interpretExplainPlanThunk(
  props: {
    namespace: string;
    explainPlan: string;
    operationType: 'query' | 'aggregation';
  },
  globalState: GlobalState,
  openDrawer: (id: string) => void
): AssistantThunkAction<void> {
  return handleEntryPoint(
    'explain plan',
    buildExplainPlanPrompt,
    props,
    globalState,
    openDrawer
  );
}

function interpretConnectionErrorThunk(
  props: {
    connectionInfo: ConnectionInfo;
    error: Error;
  },
  globalState: GlobalState,
  openDrawer: (id: string) => void
): AssistantThunkAction<void> {
  return handleEntryPoint(
    'connection error',
    buildConnectionErrorPrompt,
    props,
    globalState,
    openDrawer
  );
}

function tellMoreAboutInsightThunk(
  props: ProactiveInsightsContext,
  globalState: GlobalState,
  openDrawer: (id: string) => void
): AssistantThunkAction<void> {
  return handleEntryPoint(
    'performance insights',
    buildProactiveInsightsPrompt,
    props,
    globalState,
    openDrawer
  );
}

function interpretAnalyzeOutputThunk(
  props: AnalyzeOutputContext,
  globalState: GlobalState,
  openDrawer: (id: string) => void
): AssistantThunkAction<void> {
  return handleEntryPoint(
    'analyze output',
    buildAnalyzeOutputPrompt,
    props,
    globalState,
    openDrawer
  );
}

function diagnoseSearchStageThunk(
  props: DiagnoseSearchStageContext,
  globalState: GlobalState,
  openDrawer: (id: string) => void
): AssistantThunkAction<void> {
  return handleEntryPoint(
    'search stage diagnose',
    buildDiagnoseSearchStagePrompt,
    props,
    globalState,
    openDrawer
  );
}

// Activate function — creates a real Redux store with services as thunk extra args
function activateAssistantPlugin(
  {
    chat: initialChat,
    originForPrompt,
    appNameForPrompt,
  }: {
    chat?: Chat<AssistantMessage>;
    originForPrompt: string;
    appNameForPrompt: string;
    projectId?: string;
  },
  {
    atlasService,
    atlasAiService,
    toolsController,
    preferences,
    logger,
    track,
  }: {
    atlasService: AtlasService;
    atlasAiService: AtlasAiService;
    toolsController: ToolsController;
    preferences: PreferencesAccess;
    logger: Logger;
    track: TrackFunction;
  },
  { cleanup }: ActivateHelpers
) {
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

  const lastContextPromptRef = { current: null as string | null };

  const store = createStore(
    reducer,
    {},
    applyMiddleware(
      thunk.withExtraArgument({
        chat,
        atlasAiService,
        toolsController,
        preferences,
        logger,
        track,
        lastContextPromptRef,
      })
    )
  );

  return { store, deactivate: cleanup };
}

// Getter thunk to access chat from extra args
function getChat(): AssistantThunkAction<Chat<AssistantMessage>> {
  return (_dispatch, _getState, { chat }) => chat;
}

// Connected AssistantProvider component
const AssistantProviderInner: React.FunctionComponent<
  PropsWithChildren<{
    projectId?: string;
    getChat: () => Chat<AssistantMessage>;
    ensureOptInAndSend: (
      message: SendMessage,
      options: SendOptions,
      callback: (options: {
        requestId: string;
        connectionInfo?: BasicConnectionInfo;
      }) => void,
      globalState: GlobalState
    ) => Promise<void>;
    interpretExplainPlan: (
      props: {
        namespace: string;
        explainPlan: string;
        operationType: 'query' | 'aggregation';
      },
      globalState: GlobalState,
      openDrawer: (id: string) => void
    ) => void;
    interpretConnectionError: (
      props: {
        connectionInfo: ConnectionInfo;
        error: Error;
      },
      globalState: GlobalState,
      openDrawer: (id: string) => void
    ) => void;
    tellMoreAboutInsight: (
      props: ProactiveInsightsContext,
      globalState: GlobalState,
      openDrawer: (id: string) => void
    ) => void;
    interpretAnalyzeOutput: (
      props: AnalyzeOutputContext,
      globalState: GlobalState,
      openDrawer: (id: string) => void
    ) => void;
    diagnoseSearchStage: (
      props: DiagnoseSearchStageContext,
      globalState: GlobalState,
      openDrawer: (id: string) => void
    ) => void;
  }>
> = ({
  projectId,
  getChat: getChatAction,
  ensureOptInAndSend,
  interpretExplainPlan,
  interpretConnectionError,
  tellMoreAboutInsight,
  interpretAnalyzeOutput,
  diagnoseSearchStage,
  children,
}) => {
  // chat is stable — created once in activate, never changes
  const [chat] = React.useState(() => getChatAction());
  const { openDrawer } = useDrawerActions();

  const assistantGlobalStateRef = useCurrentValueRef(useAssistantGlobalState());
  const openDrawerRef = useCurrentValueRef(openDrawer);

  const assistantActionsContext = useInitialValue<AssistantActionsContextType>({
    interpretExplainPlan: (props) => {
      interpretExplainPlan(
        props,
        assistantGlobalStateRef.current,
        openDrawerRef.current
      );
    },
    interpretConnectionError: (props) => {
      interpretConnectionError(
        props,
        assistantGlobalStateRef.current,
        openDrawerRef.current
      );
    },
    tellMoreAboutInsight: (props) => {
      tellMoreAboutInsight(
        props,
        assistantGlobalStateRef.current,
        openDrawerRef.current
      );
    },
    interpretAnalyzeOutput: (props) => {
      interpretAnalyzeOutput(
        props,
        assistantGlobalStateRef.current,
        openDrawerRef.current
      );
    },
    diagnoseSearchStage: (props) => {
      diagnoseSearchStage(
        props,
        assistantGlobalStateRef.current,
        openDrawerRef.current
      );
    },
    ensureOptInAndSend: async (message, options, callback) => {
      await ensureOptInAndSend(
        message,
        options,
        callback,
        assistantGlobalStateRef.current
      );
    },
  });

  return (
    <AssistantContext.Provider value={chat}>
      <AssistantActionsContext.Provider value={assistantActionsContext}>
        <AssistantProjectContext.Provider value={projectId}>
          {children}
        </AssistantProjectContext.Provider>
      </AssistantActionsContext.Provider>
    </AssistantContext.Provider>
  );
};

const ConnectedAssistantProvider = connect(null, {
  getChat,
  ensureOptInAndSend: ensureOptInAndSendThunk,
  interpretExplainPlan: interpretExplainPlanThunk,
  interpretConnectionError: interpretConnectionErrorThunk,
  tellMoreAboutInsight: tellMoreAboutInsightThunk,
  interpretAnalyzeOutput: interpretAnalyzeOutputThunk,
  diagnoseSearchStage: diagnoseSearchStageThunk,
})(AssistantProviderInner);

export const CompassAssistantProvider = registerCompassPlugin(
  {
    name: 'CompassAssistant',
    component: function CompassAssistantComponent({
      children,
      projectId,
    }: PropsWithChildren<{
      appNameForPrompt: string;
      originForPrompt: string;
      chat?: Chat<AssistantMessage>;
      projectId?: string;
    }>) {
      return (
        <AssistantGlobalStateProvider>
          <ConnectedAssistantProvider projectId={projectId}>
            {children}
          </ConnectedAssistantProvider>
        </AssistantGlobalStateProvider>
      );
    },
    activate: activateAssistantPlugin,
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
        }).responses(AI_MODEL_CHAT_VERSION),
      }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onError: (err: Error) => {
      logger.log.error(
        logger.mongoLogId(1_001_000_370),
        'Assistant',
        'Failed to send a message',
        { err }
      );
      track('Assistant Failed', {
        error_name: err.name,
      });
    },
  });
}

export function setToolsContext(
  toolsController: ToolsController,
  {
    enableTelemetry,
    maxTimeMS,
    activeConnection,
    connections,
    query,
    pipeline,
    enableToolCalling,
    enableGenAIToolCalling,
    activeTab,
  }: {
    enableTelemetry: boolean;
    maxTimeMS?: number;
    activeConnection: ActiveConnectionInfo | null;
    connections: ActiveConnectionInfo[];
    query?: string | null;
    pipeline?: string | null;
    enableToolCalling?: boolean;
    enableGenAIToolCalling?: boolean;
    activeTab?: ActiveTabType;
  }
) {
  if (enableToolCalling) {
    const toolGroups = new Set<ToolGroup>([]);
    if (enableGenAIToolCalling) {
      if (activeTab === 'Documents' || activeTab === 'Schema') {
        toolGroups.add('querybar');
      }
      if (activeTab === 'Aggregations') {
        toolGroups.add('aggregation-builder');
      }
      if (activeConnection) {
        toolGroups.add('db-read');
      }
    }
    toolsController.setActiveTools(toolGroups);
    toolsController.setContext({
      enableTelemetry,
      maxTimeMS,
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
      pipeline: pipeline || undefined,
    });
  } else {
    toolsController.setActiveTools(new Set([]));
    toolsController.setContext({
      enableTelemetry,
      maxTimeMS,
      connections: [],
      query: undefined,
      pipeline: undefined,
    });
  }
}
