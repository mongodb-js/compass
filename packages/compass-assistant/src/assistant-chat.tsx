import React, { useCallback } from 'react';
import type { AssistantMessage } from './compass-assistant-provider';
import type { Chat } from './@ai-sdk/react/chat-react';
import { useChat } from './@ai-sdk/react/use-chat';
import {
  LgChatChatWindow,
  LgChatLeafygreenChatProvider,
  LgChatMessage,
  LgChatMessageFeed,
  LgChatInputBar,
  spacing,
  css,
} from '@mongodb-js/compass-components';

const { ChatWindow } = LgChatChatWindow;
const { LeafyGreenChatProvider, Variant } = LgChatLeafygreenChatProvider;
const { Message } = LgChatMessage;
const { MessageFeed } = LgChatMessageFeed;
const { InputBar } = LgChatInputBar;

interface AssistantChatProps {
  chat: Chat<AssistantMessage>;
}

// TODO(COMPASS-9751): These are temporary patches to make the Assistant chat take the entire
// width and height of the drawer since Leafygreen doesn't support this yet.
const assistantChatFixesStyles = css({
  // Negative margin to patch the padding of the drawer.
  margin: -spacing[400],
  '> div, > div > div, > div > div > div, > div > div > div > div': {
    height: '100%',
  },
});
const messageFeedFixesStyles = css({ height: '100%' });
const chatWindowFixesStyles = css({
  height: '100%',
});

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
      const trimmedMessageBody = messageBody.trim();
      if (trimmedMessageBody) {
        void sendMessage({ text: trimmedMessageBody });
      }
    },
    [sendMessage]
  );

  return (
    <div
      data-testid="assistant-chat"
      className={assistantChatFixesStyles}
      style={{ height: '100%', width: '100%' }}
    >
      <LeafyGreenChatProvider variant={Variant.Compact}>
        <ChatWindow title="MongoDB Assistant" className={chatWindowFixesStyles}>
          <MessageFeed
            data-testid="assistant-chat-messages"
            className={messageFeedFixesStyles}
          >
            {lgMessages.map((messageFields) => (
              <Message
                key={messageFields.id}
                sourceType="markdown"
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
