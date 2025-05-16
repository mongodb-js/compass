/* eslint-disable no-console */
import type { Reducer } from 'redux';
import { isAction } from './util';
import type { OpenSidebarChatAction } from './sidebar-chat';
import type { DocsChatbotThunkAction } from './reducer';
import { getStreamResponseFromDocsAI } from '@mongodb-js/compass-generative-ai';

export type ModalChatState = {
  isLoading: boolean; // Initial chat loading state (start conversation)
  loadingError: null | Error;

  messages: { role: 'user' | 'system' | 'assistant'; content: string }[];
  messagingError: null | Error;
  isMessaging: boolean; // Is the chat currently in a messaging state (sending message)

  fetchId: number;
  conversationId: string; // For each chat. Later we'll want this to be inside a map/array of chat history with the most recent the present.
};

export enum ChatActionTypes {
  CHAT_LOADING_STARTED = 'docs-chatbot/chat/CHAT_LOADING_STARTED',
  CHAT_LOADING_FINISHED = 'docs-chatbot/chat/CHAT_LOADING_FINISHED',
  CHAT_LOADING_ERRORED = 'docs-chatbot/chat/CHAT_LOADING_ERRORED',

  SEND_MESSAGE_SUBMITTED = 'docs-chatbot/chat/SEND_MESSAGE_SUBMITTED',
  SEND_MESSAGE_PROGRESS = 'docs-chatbot/chat/SEND_MESSAGE_PROGRESS',
  SEND_MESSAGE_COMPLETE = 'docs-chatbot/chat/SEND_MESSAGE_COMPLETE', // When ai response has been received.
  SEND_MESSAGE_ERROR = 'docs-chatbot/chat/SEND_MESSAGE_ERROR',
  SEND_MESSAGE_CANCEL = 'docs-chatbot/chat/SEND_MESSAGE_CANCEL',
}

export type ChatLoadingStartedAction = {
  type: ChatActionTypes.CHAT_LOADING_STARTED;
  id: number;
};
export type ChatLoadingFinishedAction = {
  type: ChatActionTypes.CHAT_LOADING_FINISHED;
  conversationId: string;
};
export type ChatLoadingErroredAction = {
  type: ChatActionTypes.CHAT_LOADING_ERRORED;
  error: Error;
};

export type SubmitMessageAction = {
  type: ChatActionTypes.SEND_MESSAGE_SUBMITTED;
  id: number;
  message: string;
};

export type SendMessageProgressAction = {
  type: ChatActionTypes.SEND_MESSAGE_PROGRESS;
  chunk: string;
};

export type SendMessageCompleteAction = {
  type: ChatActionTypes.SEND_MESSAGE_COMPLETE;
  message: string;
};

export type SendMessageErrorAction = {
  type: ChatActionTypes.SEND_MESSAGE_ERROR;
  error: Error;
};
export type SendMessageCancelAction = {
  type: ChatActionTypes.SEND_MESSAGE_CANCEL;
};

export type OpenChatOptions = {
  message: string;
  availableFollowUpActions?: {
    action: string;
    description: string;
  }[];
  namespace?: string;
  connectionId?: string;
};

// todo
export type ChatMessageAction = any;

export const openContextualMessageInChat = ({
  message,
  availableFollowUpActions,
}: OpenChatOptions): DocsChatbotThunkAction<
  Promise<string | null>, // the conversation id
  OpenSidebarChatAction
> => {
  return async (dispatch, getState, services) => {
    // TODO.

    // TODO: Maybe this initial handler in the sidebar chat?

    // TODO: Maybe this should be in a reducer.
    //   if (!getState().sidebarChat.isOpen) {

    //     // Right now the open state isn't handled here, so we'll have to app registry
    //     // this is temp.
    //     dispatch(openSidebarChat())

    //     // on(globalAppRegistry, 'open-sidebar-chat', function () {
    // //   store.dispatch(openSidebarChat());
    // // });
    //   }
    // We should have the app registry things actually in providers.
    services.globalAppRegistry.emit('open-sidebar-chat');

    // TODO: Maybe a way to hide some of the info, like with an explain
    // plan or the raw schema want to only show the user's prompt
    // and something about it, maybe show the extra info in a hidden dropdown thing.

    console.log(
      'aaa openContextualMessageInChat',
      message,
      availableFollowUpActions
    );

    // simulated delay for now, will add the chat setup eventually
    // await new Promise((resolve) => setTimeout(resolve, 5));

    await dispatch(submitMessage(message));

    return Promise.resolve('not real conversation id yet');
  };
};

const ChatAbortControllerMap = new Map<number, AbortController>();

let chatFetchId = 0;

// TODO: we should be storing the signal id in the state
// so we can abort it properly when cancelling or the
// plugin is deactivated.
function getAbortSignal() {
  const id = ++chatFetchId;
  const controller = new AbortController();
  ChatAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  const controller = ChatAbortControllerMap.get(id);
  controller?.abort();
  return ChatAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: number) {
  return ChatAbortControllerMap.delete(id);
}

export const loadChat = (): DocsChatbotThunkAction<
  Promise<void>,
  | ChatLoadingStartedAction
  | ChatLoadingErroredAction
  | ChatLoadingFinishedAction
> => {
  return async (dispatch, getState, services) => {
    // TODO: Need to update the ai backend we have here in Compass in generative-ai for the
    // docs chatbot to allow for saving the conversation for future messages.

    dispatch({
      type: ChatActionTypes.CHAT_LOADING_STARTED,
      id: ++chatFetchId,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    dispatch({
      type: ChatActionTypes.CHAT_LOADING_FINISHED,
      conversationId: 'UNUSED',
    });
  };
};

export const submitMessage = (
  message: string
): DocsChatbotThunkAction<
  Promise<void>,
  | SubmitMessageAction
  | SendMessageProgressAction
  | SendMessageCompleteAction
  | SendMessageErrorAction
> => {
  return async (dispatch, getState, services) => {
    const {
      chat: { fetchId: existingFetchId },
    } = getState();

    // Abort any ongoing AI analysis
    abort(existingFetchId);

    const abortController = new AbortController();
    const { signal } = abortController;

    dispatch({
      type: ChatActionTypes.SEND_MESSAGE_SUBMITTED,
      message,
      id: ++chatFetchId,
    });

    const aiMessageStream = getStreamResponseFromDocsAI({
      message: message,
      signal,
    });

    if (signal.aborted) {
      return;
    }

    let fullResponse = '';
    try {
      for await (const chunk of aiMessageStream) {
        if (signal.aborted) {
          return;
        }
        // console.log('aaa chunk a a received:', chunk);
        // console.log(chunk); // Log each streamed chunk
        fullResponse += chunk; // Accumulate the response
        dispatch({
          type: ChatActionTypes.SEND_MESSAGE_PROGRESS,
          chunk,
        });
      }
      console.log('aaa Full response:', fullResponse);
    } catch (error) {
      console.error('aaa Failed to stream ai response:', error);
      dispatch({
        type: ChatActionTypes.SEND_MESSAGE_ERROR,
        error: error as Error,
      });
      return;
    }

    console.log('aaa ai analysis complete, full response:\n', fullResponse);

    dispatch({
      type: ChatActionTypes.SEND_MESSAGE_COMPLETE,
      message: fullResponse,
    });
  };
};

export type ChatActions =
  | ChatLoadingStartedAction
  | ChatLoadingFinishedAction
  | ChatLoadingErroredAction
  | SubmitMessageAction
  | SendMessageProgressAction
  | SendMessageCompleteAction
  | SendMessageErrorAction
  | SendMessageCancelAction;

const INITIAL_STATE: ModalChatState = {
  messages: [],
  isLoading: false,
  fetchId: -1,
  messagingError: null,
  isMessaging: false,
  conversationId: '',
  loadingError: null,
};

export const chatReducer: Reducer<ModalChatState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, ChatActionTypes.CHAT_LOADING_STARTED)) {
    return {
      ...state,
      loadingError: null,
      fetchId: action.id,
      isLoading: true,
      isMessaging: false,
    };
  }

  if (isAction(action, ChatActionTypes.CHAT_LOADING_FINISHED)) {
    return {
      ...state,
      loadingError: null,
      messagingError: null,
      conversationId: action.conversationId,
      isLoading: false,
      isMessaging: false,
    };
  }

  if (isAction(action, ChatActionTypes.CHAT_LOADING_ERRORED)) {
    return {
      ...state,
      loadingError: action.error,
    };
  }

  if (isAction(action, ChatActionTypes.SEND_MESSAGE_SUBMITTED)) {
    return {
      ...state,
      fetchId: action.id,
      messages: [...state.messages, { role: 'user', content: action.message }],
      messagingError: null,
      isMessaging: true,
    };
  }
  if (isAction(action, ChatActionTypes.SEND_MESSAGE_ERROR)) {
    return {
      ...state,
      messagingError: action.error,
      isMessaging: false,
    };
  }
  if (isAction(action, ChatActionTypes.SEND_MESSAGE_PROGRESS)) {
    return {
      ...state,
      // TODO: Stream assistant message to state.
      messagingError: null,
      isMessaging: true,
    };
  }

  if (isAction(action, ChatActionTypes.SEND_MESSAGE_COMPLETE)) {
    return {
      ...state,
      messages: [
        ...state.messages,
        { role: 'assistant', content: action.message },
      ],
      isLoading: false,
      error: null,
      isMessaging: false,
    };
  }

  if (isAction(action, ChatActionTypes.SEND_MESSAGE_CANCEL)) {
    return {
      ...state,
      isLoading: false,
      error: new Error('Cancelled'),
      isMessaging: false,
    };
  }
  // if (
  //   isAction(action, SidebarChatActionTypes.OPEN_CHAT)
  // ) {
  //   // TODO: We don't want to clear on open/close. Just an example.
  //   return {
  //     ...state,messages: [] };
  // }

  return state;
};
