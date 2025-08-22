import React, { useCallback } from 'react';
import type { AssistantMessage } from './compass-assistant-provider';
import type { Chat } from './vendor/@ai-sdk/react/chat-react';
import { useChat } from './vendor/@ai-sdk/react/use-chat';
import { ChatWindow } from './vendor/@lg-chat/chat-window/src/ChatWindow';
import {
  LeafyGreenChatProvider,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';
import { Message } from '@lg-chat/message';
import { MessageFeed } from '@lg-chat/message-feed';
import { InputBar } from '@lg-chat/input-bar';
import { InputBarFeedback } from '@lg-chat/input-bar/src/InputBar/InputBarFeedback';

interface AssistantChatProps {
  chat: Chat<AssistantMessage>;
}

export const AssistantChat: React.FunctionComponent<AssistantChatProps> = ({
  chat,
}) => {
  const { messages, sendMessage, status } = useChat({
    chat,
  });

  // Transform AI SDK messages to LeafyGreen chat format
  const lgMessages = messages.map((message) => ({
    id: message.id,
    messageBody:
      message.metadata?.displayText ||
      message.parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('') ||
      '',
    isSender: message.role === 'user',
  }));

  const handleMessageSend = useCallback(
    (messageBody: string) => {
      void sendMessage({ text: messageBody });
    },
    [sendMessage]
  );

  return (
    <div data-testid="assistant-chat" style={{ height: '100%', width: '100%' }}>
      <LeafyGreenChatProvider variant={Variant.Compact}>
        <ChatWindow title="MongoDB Assistant">
          <MessageFeed data-testid="assistant-chat-messages">
            {lgMessages.map((messageFields) => (
              <Message
                key={messageFields.id}
                {...messageFields}
                data-testid={`assistant-message-${messageFields.id}`}
              />
            ))}
            {status === 'submitted' && (
              <Message
                id="loading"
                messageBody="Thinking..."
                isSender={false}
              />
            )}
            <InputBarFeedback />
          </MessageFeed>
          <InputBar
            data-testid="assistant-chat-input"
            onMessageSend={handleMessageSend}
            textareaProps={{
              placeholder: 'Ask MongoDB Assistant a question',
            }}
          />
        </ChatWindow>
      </LeafyGreenChatProvider>
    </div>
  );
};
