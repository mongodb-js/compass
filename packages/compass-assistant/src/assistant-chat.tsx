import React, { useCallback, useState } from 'react';
import type { UIMessage } from './@ai-sdk/react/use-chat';
import type { Chat } from './@ai-sdk/react/chat-react';
import { useChat } from './@ai-sdk/react/use-chat';

interface AssistantChatProps {
  chat: Chat<UIMessage>;
}

/**
 * This component is currently using placeholders as Leafygreen UI updates are not available yet.
 * Before release, we will replace this with the actual Leafygreen chat components.
 */
export const AssistantChat: React.FunctionComponent<AssistantChatProps> = ({
  chat,
}) => {
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage } = useChat({
    chat,
  });

  const handleInputSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputValue.trim()) {
        void sendMessage({ text: inputValue.trim() });
        setInputValue('');
      }
    },
    [inputValue, sendMessage]
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
      data-testid="assistant-chat"
    >
      {/* Message Feed */}
      <div
        data-testid="assistant-chat-messages"
        style={{
          width: '100%',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: 0,
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            data-testid={`assistant-message-${message.id}`}
            style={{
              marginBottom: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: message.role === 'user' ? '#207245' : '#e9ecef',
              color: message.role === 'user' ? 'white' : '#333',
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.parts
              ?.filter((part) => part.type === 'text')
              .map((part) => part.text)
              .join('') || ''}
          </div>
        ))}
      </div>

      {/* Input Bar */}
      <form
        data-testid="assistant-chat-form"
        onSubmit={handleInputSubmit}
        style={{
          display: 'flex',
          gap: '8px',
          flexShrink: 0, // Prevents the input bar from shrinking
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'inherit',
          paddingTop: '8px',
        }}
      >
        <input
          data-testid="assistant-chat-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask MongoDB Assistant a question"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
        <button
          data-testid="assistant-chat-send-button"
          type="submit"
          disabled={!inputValue.trim()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#207245',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            opacity: inputValue.trim() ? 1 : 0.6,
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};
