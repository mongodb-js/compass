import { DrawerSection } from '@mongodb-js/compass-components';
import React, { type PropsWithChildren, useCallback, useRef } from 'react';
import { type UIMessage, useChat } from './@ai-sdk/react/use-chat';
import type { Chat } from './@ai-sdk/react/chat.react';
import { AsisstantChat } from './assistant-chat';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

import { createContext, useContext } from 'react';
import { docsProviderTransport } from './docs-provider-transport';

type AssistantActions = unknown;

export const AssistantActionsContext = createContext<AssistantActions>({});

export function useAssistantActions(): AssistantActions {
  return useContext(AssistantActionsContext);
}

export const AssistantProvider: React.FunctionComponent<
  PropsWithChildren<{
    chat?: Chat<UIMessage>;
  }>
> = ({ chat, children }) => {
  const { messages, sendMessage } = useChat({
    transport: docsProviderTransport,
    chat,
  });

  const contextActions = useRef({});

  const handleMessageSend = useCallback(
    (messageBody: string) => {
      /** Telemetry, etc. */
      void sendMessage({ text: messageBody });
    },
    [sendMessage]
  );

  return (
    <AssistantActionsContext.Provider value={contextActions.current}>
      <DrawerSection
        id={ASSISTANT_DRAWER_ID}
        title="MongoDB Assistant"
        label="MongoDB Assistant"
        glyph="Sparkle"
      >
        <AsisstantChat messages={messages} onSendMessage={handleMessageSend} />
      </DrawerSection>
      {children}
    </AssistantActionsContext.Provider>
  );
};

// Keep the old component name for backward compatibility during transition
export const AssistantDrawerSection = AssistantProvider;
