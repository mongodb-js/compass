import type { Reducer } from 'redux';
import { isAction } from './util';

export type SidebarChatState = {
  isOpen: boolean;
};

export enum SidebarChatActionTypes {
  OPEN_CHAT = 'docs-chatbot/sidebar-chat/OPEN_CHAT',
  CLOSE_CHAT = 'docs-chatbot/sidebar-chat/CLOSE_CHAT',
}
export type SidebarChatActions = OpenSidebarChatAction | CloseSidebarChatAction;

export type OpenSidebarChatAction = {
  type: SidebarChatActionTypes.OPEN_CHAT;
};

export type CloseSidebarChatAction = {
  type: SidebarChatActionTypes.CLOSE_CHAT;
};

export const openSidebarChat = (): OpenSidebarChatAction => ({
  type: SidebarChatActionTypes.OPEN_CHAT,
});
export const closeSidebarChat = (): CloseSidebarChatAction => ({
  type: SidebarChatActionTypes.CLOSE_CHAT,
});

const INITIAL_STATE: SidebarChatState = { isOpen: false };

export const sidebarChatReducer: Reducer<SidebarChatState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, SidebarChatActionTypes.OPEN_CHAT)) {
    return { isOpen: true };
  }
  if (isAction(action, SidebarChatActionTypes.CLOSE_CHAT)) {
    return { isOpen: false };
  }
  return state;
};
