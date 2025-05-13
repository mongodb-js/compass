import React, { useState } from 'react';
import {
  Card,
  TextInput,
  Button,
  Body,
  css,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

type MessageType = 'system' | 'user';

interface Message {
  type: MessageType;
  content: string;
  timestamp: Date;
}

const chatContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  gap: spacing[200],
});

const chatHistoryStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  flexGrow: 1,
  overflowY: 'auto',
  padding: spacing[200],
});

const messageContainerStyles = css({
  display: 'flex',
  width: '100%',
});

const systemMessageStyles = css({
  marginRight: 'auto',
  maxWidth: '70%',
});

const userMessageStyles = css({
  marginLeft: 'auto',
  maxWidth: '70%',
});

const messageCardStyles = css({
  padding: spacing[200],
});

const systemMessageCardStyles = css({
  backgroundColor: palette.gray.light2,
});

const userMessageCardStyles = css({
  backgroundColor: palette.green.light2,
});

const inputContainerStyles = css({
  display: 'flex',
  gap: spacing[200],
  padding: spacing[200],
  borderTop: `1px solid ${palette.gray.light2}`,
});

export function MCPChat(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: Message = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date(),
    };

    const systemResponse: Message = {
      type: 'system',
      content: `This is a response to "${currentMessage}"`,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage, systemResponse]);

    setCurrentMessage('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentMessage(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className={chatContainerStyles}>
      {/* Chat messages */}
      <div className={chatHistoryStyles}>
        {messages.map((message, index) => (
          <div key={index} className={messageContainerStyles}>
            <div
              className={
                message.type === 'system'
                  ? systemMessageStyles
                  : userMessageStyles
              }
            >
              <Card
                className={css(
                  messageCardStyles,
                  message.type === 'system'
                    ? systemMessageCardStyles
                    : userMessageCardStyles
                )}
              >
                <Body>{message.content}</Body>
              </Card>
            </div>
          </div>
        ))}
      </div>

      {/* Input area */}
      <div className={inputContainerStyles}>
        <TextInput
          aria-label="Type your message"
          placeholder="Type your message..."
          value={currentMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <Button
          variant="primary"
          onClick={handleSendMessage}
          disabled={!currentMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}

export default MCPChat;
