import type { AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type {
  SidebarChatActions,
  SidebarChatActionTypes,
} from './sidebar-chat';
import type { ChatActions, ChatActionTypes } from './chat';
import { chatReducer } from './chat';
import { sidebarChatReducer } from './sidebar-chat';
import type { ThunkAction } from 'redux-thunk';
import type { DocsChatbotStoreServices } from '.';

const reducer = combineReducers({
  chat: chatReducer,
  sidebarChat: sidebarChatReducer,
});

export type DocsChatbotActions = ChatActions | SidebarChatActions;

export type DocsChatbotActionTypes = ChatActionTypes | SidebarChatActionTypes;

export type DocsChatbotState = ReturnType<typeof reducer>;

export type DocsChatbotExtraArgs = DocsChatbotStoreServices & {
  cancelControllerRef: { current: AbortController | null };
};

export type DocsChatbotThunkAction<R, A extends AnyAction> = ThunkAction<
  R,
  DocsChatbotState,
  DocsChatbotExtraArgs,
  A
>;

export default reducer;
