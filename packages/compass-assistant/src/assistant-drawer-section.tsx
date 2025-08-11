import {
  DrawerSection,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import React, { useCallback, useEffect } from 'react';
import { Chat } from '@mongodb-js/compass-components';
import { useAssistantChat } from './stores/hooks';
import { docsProviderTransport } from './docs-provider-transport';
import { useChat } from './@ai-sdk/react/use-chat';
import { appendMessages } from './stores';

export const ASSISTANT_DRAWER_ID = 'compass-assistant-drawer';

export const AssistantDrawerSection: React.FunctionComponent = () => {
  const { messages: initialMessages, setMessages } = useAssistantChat();
  const { messages, sendMessage } = useChat({
    transport: docsProviderTransport,
    messages: initialMessages,
    onFinish: ({ message }) => {
      appendMessages([message]);
    },
  });
  const { openDrawer } = useDrawerActions();

  useEffect(() => {
    setMessages(messages);
  }, [messages, setMessages]);

  const handleMessageSend = useCallback(
    (messageBody: string) => {
      /** Telemetry, etc. */
      void sendMessage({ text: messageBody });
    },
    [sendMessage]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      openDrawer('compass-assistant-drawer');
    }, 100);

    return () => clearTimeout(timer);
  }, [openDrawer]);

  return (
    <DrawerSection
      id={ASSISTANT_DRAWER_ID}
      title="MongoDB Assistant"
      label="MongoDB Assistant"
      glyph="Sparkle"
      autoOpen={true}
    >
      <Chat.LeafyGreenChatProvider variant="compact">
        <Chat.ChatWindow title="Compass AI Assistant">
          <Chat.MessageFeed>
            {messages.map((message) => (
              <Chat.Message
                key={message.id}
                sourceType="markdown"
                messageBody={
                  message.parts
                    ?.filter((part) => part.type === 'text')
                    .map((part) => part.text)
                    .join('') || ''
                }
                isSender={message.role === 'user'}
              />
            ))}
          </Chat.MessageFeed>
          <Chat.InputBar
            onMessageSend={handleMessageSend}
            textareaProps={{ placeholder: 'Ask MongoDB Assistant a question' }}
          />
        </Chat.ChatWindow>
      </Chat.LeafyGreenChatProvider>
    </DrawerSection>
  );
};
