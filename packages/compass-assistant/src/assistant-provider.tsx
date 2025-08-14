import { DrawerSection } from '@mongodb-js/compass-components';
import React, { type PropsWithChildren, useCallback, useRef } from 'react';
import { type UIMessage, useChat } from './@ai-sdk/react/use-chat';
import type { Chat } from './@ai-sdk/react/chat-react';
import { AssistantChat } from './assistant-chat';
import { usePreference } from 'compass-preferences-model/provider';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

import { createContext, useContext } from 'react';

type AssistantActions = unknown;

export const AssistantActionsContext = createContext<AssistantActions>({});

export function useAssistantActions(): AssistantActions {
  return useContext(AssistantActionsContext);
}

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    chat: Chat<UIMessage>;
  }>
> = ({ chat, children }) => {
  const enableAIAssistant = usePreference('enableAIAssistant');

  const { messages, sendMessage } = useChat({
    chat,
  });

  const contextActions = useRef({});

  const handleMessageSend = useCallback(
    (messageBody: string) => {
      void sendMessage({ text: messageBody });
    },
    [sendMessage]
  );

  if (!enableAIAssistant) {
    return <>{children}</>;
  }

  return (
    <AssistantActionsContext.Provider value={contextActions.current}>
      <DrawerSection
        id={ASSISTANT_DRAWER_ID}
        title="MongoDB Assistant"
        label="MongoDB Assistant"
        glyph="Sparkle"
      >
        <AssistantChat messages={messages} onSendMessage={handleMessageSend} />
      </DrawerSection>
      {children}
    </AssistantActionsContext.Provider>
  );
};

// Keep the old component name for backward compatibility during transition
export const AssistantDrawerSection = AssistantProvider;
