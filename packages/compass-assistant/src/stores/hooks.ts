import { useSelector, useStore } from 'react-redux';
import { useCallback } from 'react';
import { useDrawerActions } from '@mongodb-js/compass-components';
import type { RootState, AssistantStore } from './index';
import { appendMessages, setMessages, clearMessages } from './index';
import type { UIMessage } from 'ai';

/** Hook for interacting with the assistant inside the chat */
export function useAssistantChat() {
  const state = useSelector((state: RootState) => state.assistant);
  const store = useStore() as AssistantStore;

  const actions = {
    setMessages: useCallback(
      (messages: UIMessage[]) => {
        store.dispatch(setMessages(messages));
      },
      [store]
    ),

    clearMessages: useCallback(() => {
      store.dispatch(clearMessages());
    }, [store]),
  };

  return {
    ...state,
    ...actions,
  };
}

/** Hooks for opening and closing the assistant outside chat context */
export function useAssistant() {
  const store = useStore() as AssistantStore;
  const { openDrawer, closeDrawer } = useDrawerActions();

  return {
    openAssistant: useCallback(
      ({ appendedMessages }: { appendedMessages?: UIMessage[] }) => {
        if (appendedMessages) {
          store.dispatch(appendMessages(appendedMessages));
        }
        openDrawer('compass-assistant-drawer');
      },
      [openDrawer, store]
    ),

    closeAssistant: useCallback(() => {
      closeDrawer();
    }, [closeDrawer]),
  };
}
