import { createStore, combineReducers, applyMiddleware } from 'redux';
import type { AnyAction, Reducer } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { UIMessage } from 'ai';

export interface AssistantState {
  messages: UIMessage[];
}

export const APPEND_MESSAGES = 'compass-assistant/APPEND_MESSAGES';
export const SET_MESSAGES = 'compass-assistant/SET_MESSAGES';
export const CLEAR_MESSAGES = 'compass-assistant/CLEAR_MESSAGES';

interface AppendMessagesAction {
  type: typeof APPEND_MESSAGES;
  payload: UIMessage[];
}

interface SetMessagesAction {
  type: typeof SET_MESSAGES;
  payload: UIMessage[];
}

interface ClearMessagesAction {
  type: typeof CLEAR_MESSAGES;
}

export type AssistantActions =
  | AppendMessagesAction
  | SetMessagesAction
  | ClearMessagesAction;

// Action creators
export const appendMessages = (
  messages: UIMessage[]
): AppendMessagesAction => ({
  type: APPEND_MESSAGES,
  payload: messages,
});

export const setMessages = (messages: UIMessage[]): SetMessagesAction => ({
  type: SET_MESSAGES,
  payload: messages,
});

export const clearMessages = (): ClearMessagesAction => ({
  type: CLEAR_MESSAGES,
});

const initialState: AssistantState = {
  messages: [],
};

const assistantReducer = (
  state = initialState,
  action: AssistantActions
): AssistantState => {
  switch (action.type) {
    case APPEND_MESSAGES:
      return {
        ...state,
        messages: [...state.messages, ...action.payload],
      };
    case SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
      };
    case CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
};

export interface AssistantPluginServices {
  logger: Logger;
  globalAppRegistry: AppRegistry;
}

export interface AssistantThunkExtraArgs {
  logger: Logger;
  globalAppRegistry: AppRegistry;
}

export type RootState = {
  assistant: AssistantState;
};

export type AssistantThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, RootState, AssistantThunkExtraArgs, A>;

export function configureStore(services: AssistantPluginServices) {
  const store = createStore(
    combineReducers({
      assistant: assistantReducer,
    }) as Reducer<RootState>,
    applyMiddleware(
      thunk.withExtraArgument({
        logger: services.logger,
        globalAppRegistry: services.globalAppRegistry,
      })
    )
  );

  return store;
}

export type AssistantStore = ReturnType<typeof configureStore>;

export function activateAssistantPlugin(
  _initialProps: unknown,
  services: AssistantPluginServices,
  { cleanup }: ActivateHelpers
) {
  const store = configureStore(services);

  return {
    store,
    deactivate() {
      cleanup();
    },
  };
}
