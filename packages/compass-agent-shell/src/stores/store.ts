import type { Reducer, AnyAction, Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { WorkerRuntime } from '@mongosh/node-runtime-worker-thread';

// ─── Message types ───────────────────────────────────────────

export type CommandRisk = 'read' | 'write' | 'update' | 'delete' | 'admin';

export type PendingCommand = {
  command: string;
  explanation: string;
  risk: CommandRisk;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  pendingCommand?: PendingCommand;
  executionResult?: string;
  isError?: boolean;
};

export type AgentConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

// ─── State ───────────────────────────────────────────────────

export type AgentShellState = {
  messages: ChatMessage[];
  isLoading: boolean;
  agentConfig: AgentConfig;
  showConfig: boolean;
};

const getInitialState = (): AgentShellState => ({
  messages: [
    {
      id: 'welcome',
      role: 'system',
      content:
        'Welcome to the AI Agent Shell. Ask me anything about your database in plain English — I will generate mongosh commands for you. Configure your API key in the settings panel to get started.',
      timestamp: Date.now(),
    },
  ],
  isLoading: false,
  agentConfig: {
    apiKey: '',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  showConfig: true,
});

// ─── Actions ─────────────────────────────────────────────────

export const AgentActions = {
  AddMessage: 'compass-agent-shell/AddMessage',
  SetLoading: 'compass-agent-shell/SetLoading',
  UpdateConfig: 'compass-agent-shell/UpdateConfig',
  ToggleConfig: 'compass-agent-shell/ToggleConfig',
  UpdatePendingResult: 'compass-agent-shell/UpdatePendingResult',
} as const;

type AddMessageAction = {
  type: typeof AgentActions.AddMessage;
  message: ChatMessage;
};

type SetLoadingAction = {
  type: typeof AgentActions.SetLoading;
  isLoading: boolean;
};

type UpdateConfigAction = {
  type: typeof AgentActions.UpdateConfig;
  config: Partial<AgentConfig>;
};

type ToggleConfigAction = {
  type: typeof AgentActions.ToggleConfig;
};

type UpdatePendingResultAction = {
  type: typeof AgentActions.UpdatePendingResult;
  messageId: string;
  executionResult: string;
  isError?: boolean;
};

type AgentAction =
  | AddMessageAction
  | SetLoadingAction
  | UpdateConfigAction
  | ToggleConfigAction
  | UpdatePendingResultAction;

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

// ─── Reducer ─────────────────────────────────────────────────

const reducer: Reducer<AgentShellState, Action> = (
  state = getInitialState(),
  action
) => {
  if (isAction<AddMessageAction>(action, AgentActions.AddMessage)) {
    return {
      ...state,
      messages: [...state.messages, action.message],
    };
  }

  if (isAction<SetLoadingAction>(action, AgentActions.SetLoading)) {
    return {
      ...state,
      isLoading: action.isLoading,
    };
  }

  if (isAction<UpdateConfigAction>(action, AgentActions.UpdateConfig)) {
    return {
      ...state,
      agentConfig: {
        ...state.agentConfig,
        ...action.config,
      },
    };
  }

  if (isAction<ToggleConfigAction>(action, AgentActions.ToggleConfig)) {
    return {
      ...state,
      showConfig: !state.showConfig,
    };
  }

  if (
    isAction<UpdatePendingResultAction>(
      action,
      AgentActions.UpdatePendingResult
    )
  ) {
    return {
      ...state,
      messages: state.messages.map((msg) =>
        msg.id === action.messageId
          ? {
              ...msg,
              executionResult: action.executionResult,
              isError: action.isError,
            }
          : msg
      ),
    };
  }

  return state;
};

export default reducer;

// ─── Action Creators ─────────────────────────────────────────

let messageCounter = 0;
const getMessageId = () => `msg-${Date.now()}-${++messageCounter}`;

export const addMessage = (
  role: ChatMessage['role'],
  content: string,
  pendingCommand?: PendingCommand
): AddMessageAction => ({
  type: AgentActions.AddMessage,
  message: {
    id: getMessageId(),
    role,
    content,
    timestamp: Date.now(),
    pendingCommand,
  },
});

export const setLoading = (isLoading: boolean): SetLoadingAction => ({
  type: AgentActions.SetLoading,
  isLoading,
});

export const updateConfig = (
  config: Partial<AgentConfig>
): UpdateConfigAction => ({
  type: AgentActions.UpdateConfig,
  config,
});

export const toggleConfig = (): ToggleConfigAction => ({
  type: AgentActions.ToggleConfig,
});

export const updatePendingResult = (
  messageId: string,
  executionResult: string,
  isError?: boolean
): UpdatePendingResultAction => ({
  type: AgentActions.UpdatePendingResult,
  messageId,
  executionResult,
  isError,
});
