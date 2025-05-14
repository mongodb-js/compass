import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import type { DocsChatbotState } from '../store/reducer';
import {
  Button,
  ErrorSummary,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { loadChat, submitMessage } from '../store/chat';
// import Chatbot, {
//   FloatingActionButtonTrigger,
//   InputBarTrigger,
//   ModalView,
//   MongoDbLegalDisclosure,
//   mongoDbVerifyInformationMessage,
// } from 'mongodb-chatbot-ui';

// Chat component that both the sidebar and the tab use.
function _Chat({
  isLoading,
  loadingError,
  messagingError,
  isMessaging,
  messages,
  onSendMessage,
  onLoadChat,
}: {
  isLoading: boolean;
  loadingError: Error | null;
  messagingError: Error | null;
  isMessaging: boolean;
  messages: {
    role: 'user' | 'system' | 'assistant';
    content: string;
  }[];
  onSendMessage: (message: string) => Promise<void>;
  onLoadChat: () => Promise<void>;
}) {
  const suggestedPrompts = [
    'How do I create a new MongoDB Atlas cluster?',
    'Can MongoDB store lists of data?',
    'How does vector search work?',
  ];

  useEffect(() => {
    // TODO: This really should be in the reducer.
    void onLoadChat();
  }, [onLoadChat]);

  if (loadingError) {
    return <ErrorSummary errors={loadingError.message} />;
  }

  if (isLoading) {
    return <SpinLoader title="Loading…" />;
  }

  return (
    <div>
      <Button variant="primary" onClick={() => void onSendMessage('hello')}>
        Send hello
      </Button>
      {messages.map((message, index) => {
        return (
          <div key={index}>
            <strong>{message.role}</strong>: {message.content}
          </div>
        );
      })}
      {messagingError && <ErrorSummary errors={messagingError.message} />}
      {isMessaging && <SpinLoader title="Messaging…" />}
      {/* <Chatbot
        name="MongoDB AI"
        maxInputCharacters={300}
        serverBaseUrl="https://knowledge.mongodb.com/"
      >
        <InputBarTrigger
          bottomContent={<MongoDbLegalDisclosure />}
          suggestedPrompts={suggestedPrompts}
        />
        <FloatingActionButtonTrigger text="Ask My MongoDB AI" />
        <ModalView
          disclaimer={<MongoDbLegalDisclosure />}
          initialMessageText="Welcome to my MongoDB AI Assistant. What can I help you with?"
          initialMessageSuggestedPrompts={suggestedPrompts}
          inputBottomText={mongoDbVerifyInformationMessage}
        />
      </Chatbot> */}
    </div>
  );
}

export const Chat = connect(
  (state: DocsChatbotState) => {
    return {
      messages: state.chat.messages,
      loadingError: state.chat.loadingError,
      messagingError: state.chat.messagingError,
      isLoading: state.chat.isLoading,
      isMessaging: state.chat.isMessaging,
    };
  },
  {
    onSendMessage: submitMessage,
    onLoadChat: loadChat,
  }
)(_Chat);
