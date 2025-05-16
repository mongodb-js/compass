/* eslint-disable no-console */
import type { Reducer } from 'redux';
import { ObjectId } from 'bson';
import {
  getStreamResponseFromDocsAI,
  getChatStreamResponseFromAI,
} from '@mongodb-js/compass-generative-ai';
import type {
  ChatMessage,
  OpenChatOptions,
} from '@mongodb-js/compass-components';

import { isAction } from './util';
import type { OpenSidebarChatAction } from './sidebar-chat';
import type { DocsChatbotThunkAction } from './reducer';

export type ModalChatState = {
  isLoading: boolean; // Initial chat loading state (start conversation)
  loadingError: null | Error;

  messages: ChatMessage[];
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
  fetchId: number;
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
  fetchId: number;
  message: ChatMessage;
};

export type SendMessageProgressAction = {
  type: ChatActionTypes.SEND_MESSAGE_PROGRESS;
  messageId: string;
  chunk: string;
};

export type SendMessageCompleteAction = {
  type: ChatActionTypes.SEND_MESSAGE_COMPLETE;
  messageId: string;
  content: string;
};

export type SendMessageErrorAction = {
  type: ChatActionTypes.SEND_MESSAGE_ERROR;
  error: Error;
};
export type SendMessageCancelAction = {
  type: ChatActionTypes.SEND_MESSAGE_CANCEL;
};

// todo
export type ChatMessageAction = any;

export const openContextualMessageInChat = (
  message: OpenChatOptions
): DocsChatbotThunkAction<
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
    // services.globalAppRegistry.emit('open-sidebar-chat');

    await dispatch(loadNewChat());

    // TODO: Maybe a way to hide some of the info, like with an explain
    // plan or the raw schema want to only show the user's prompt
    // and something about it, maybe show the extra info in a hidden dropdown thing.

    console.log('aaa openContextualMessageInChat', message.content, message);

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

export const loadNewChat = (): DocsChatbotThunkAction<
  Promise<string | undefined>,
  | ChatLoadingStartedAction
  | ChatLoadingErroredAction
  | ChatLoadingFinishedAction
> => {
  return async (dispatch, getState, services) => {
    // TODO: Need to update the ai backend we have here in Compass in generative-ai for the
    // docs chatbot to allow for saving the conversation for future messages.

    const {
      chat: { fetchId: existingFetchId },
    } = getState();
    // Abort any ongoing AI things.
    abort(existingFetchId);

    const { id: fetchId, signal } = getAbortSignal();

    dispatch({
      type: ChatActionTypes.CHAT_LOADING_STARTED,
      fetchId,
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (signal.aborted) {
      return;
    }

    const conversationId = 'UNUSED'; // TODO: Get the conversation id from the ai backend.

    dispatch({
      type: ChatActionTypes.CHAT_LOADING_FINISHED,
      conversationId,
    });

    cleanupAbortSignal(fetchId);

    return conversationId;
  };
};

// const testMessage = `
// Example test message from the ai.
// *Nice*
// Hello
// `;

// async function* asyncGeneratorWithTimeout(whatToYield: string) {
//   const characterArray = whatToYield.split('');
//   // Simulate a delay for each yield, and randomize the delay time.
//   // Yield a random amount of next characters from the string, no more than 5.
//   // Until there are no characters left in the string.
//   while (characterArray.length > 0) {
//     const randomIndex = Math.min(
//       3,
//       Math.ceil(Math.random() * Math.random() * characterArray.length)
//     );
//     const randomCharacters = characterArray.splice(0, randomIndex); // Remove the characters from the array
//     await new Promise((resolve) =>
//       setTimeout(resolve, Math.floor(Math.random() * 70))
//     );
//     yield randomCharacters.join(''); // Yield the random characters
//     // console.log('aaa Yielding:', randomCharacters.join(''));
//   }
// }

export const submitMessage = (
  message: ChatMessage
): DocsChatbotThunkAction<
  Promise<void>,
  | SubmitMessageAction
  | SendMessageProgressAction
  | SendMessageCompleteAction
  | SendMessageErrorAction
> => {
  return async (dispatch, getState, services) => {
    const {
      chat: { messages, fetchId: existingFetchId },
    } = getState();

    // Abort any ongoing AI analysis
    abort(existingFetchId);

    const { id: signalId, signal } = getAbortSignal();

    dispatch({
      type: ChatActionTypes.SEND_MESSAGE_SUBMITTED,
      message,
      fetchId: signalId,
    });

    // const messageId = message.id;

    const responseId = new ObjectId().toHexString();

    const messageContent = `${message.content}${
      message.hiddenContent ? `\n${message.hiddenContent}` : ''
    }`;
    // Disabled while testing.
    // const aiMessageStream = getStreamResponseFromDocsAI({
    //   message: messageContent,
    //   signal,
    // });

    const aiMessageStream = getChatStreamResponseFromAI({
      messages: [
        ...messages,
        {
          role: 'user',
          content: messageContent,
        },
      ],
      signal,
    });

    // const aiMessageStream = asyncGeneratorWithTimeout(testMessage);

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
          messageId: responseId,
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
    } finally {
      cleanupAbortSignal(signalId);
    }

    console.log('aaa ai analysis complete, full response:\n', fullResponse);

    dispatch({
      type: ChatActionTypes.SEND_MESSAGE_COMPLETE,
      messageId: responseId,
      content: fullResponse,
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
      messages: [],
      fetchId: action.fetchId,
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
      messages: [],
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
      fetchId: action.fetchId,
      messages: [...state.messages, { ...action.message }],
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
      messages: state.messages.find(
        (message) => message.id === action.messageId
      )
        ? state.messages.map((message) => {
            if (message.id === action.messageId) {
              return {
                ...message,
                content: message.content + action.chunk,
              };
            }
            return message;
          })
        : [
            ...state.messages,
            {
              id: action.messageId,
              role: 'assistant',
              content: action.chunk,
            },
          ],
      messagingError: null,
      isMessaging: true,
    };
  }

  if (isAction(action, ChatActionTypes.SEND_MESSAGE_COMPLETE)) {
    return {
      ...state,
      // messages: [
      //   ...state.messages,
      //   { role: 'assistant', content: action.message },
      // ],
      messages: state.messages.find(
        (message) => message.id === action.messageId
      )
        ? state.messages.map((message) => {
            if (message.id === action.messageId) {
              return {
                ...message,
                // TODO: Maybe we have links now.
                content: message.content,
              };
            }
            return message;
          })
        : [
            ...state.messages,
            {
              id: action.messageId,
              role: 'assistant',
              content: action.content,
            },
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
