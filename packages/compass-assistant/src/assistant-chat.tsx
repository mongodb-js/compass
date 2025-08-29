import React, { useCallback } from 'react';
import type { AssistantMessage } from './compass-assistant-provider';
import type { Chat } from './@ai-sdk/react/chat-react';
import { useChat } from './@ai-sdk/react/use-chat';
import {
  LgChatChatWindow,
  LgChatLeafygreenChatProvider,
  LgChatMessage,
  LgChatMessageFeed,
  LgChatMessageActions,
  LgChatInputBar,
  spacing,
  css,
  Banner,
  cx,
  fontFamilies,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const { ChatWindow } = LgChatChatWindow;
const { LeafyGreenChatProvider, Variant } = LgChatLeafygreenChatProvider;
const { Message } = LgChatMessage;
const { MessageFeed } = LgChatMessageFeed;
const { MessageActions } = LgChatMessageActions;
const { InputBar } = LgChatInputBar;

interface AssistantChatProps {
  chat: Chat<AssistantMessage>;
}

const assistantChatStyles = css({
  // Compass has a global bullet point override but we clear this for the chat.
  ul: {
    listStyleType: 'disc',
  },
  ol: {
    listStyleType: 'decimal',
  },
});

const headerStyleDarkModeFixes = css({
  'h1, h2, h3, h4, h5, h6': {
    color: palette.gray.light2,
  },
});

const headerStyleLightModeFixes = css({
  'h1, h2, h3, h4, h5, h6': {
    color: palette.black,
  },
});

// TODO(COMPASS-9751): These are temporary patches to make the Assistant chat take the entire
// width and height of the drawer since Leafygreen doesn't support this yet.
const assistantChatFixesStyles = css({
  // Negative margin to patch the padding of the drawer.
  marginTop: -spacing[400],
  '> div, > div > div, > div > div > div, > div > div > div': {
    height: '100%',
  },
  // This is currently set to 'pre-wrap' which causes list items to be on a different line than the list markers.
  'li, ol': {
    whiteSpace: 'normal',
  },
  /** TODO(COMPASS-9751): We're adjusting styling of all the headers to a lower level than the default for chat, this should be updated in Leafygreen as well and removed from our end. */
  'h1, h2, h3, h4, h5, h6': {
    margin: 'unset',
    fontFamily: fontFamilies.default,
  },
  /** h4, h5, h6 -> body 1 styling */
  'h4, h5, h6': {
    fontSize: '13px',
  },
  /** h1 -> h3 styling */
  h1: {
    fontSize: '24px',
    lineHeight: '32px',
    fontWeight: 'medium',
  },
  /** h2 -> subtitle styling */
  h2: {
    color: '#001E2B',
    fontWeight: 'semibold',
    fontSize: '18px',
  },
  /** h3 -> body 2 styling */
  h3: {
    fontSize: '16px',
    fontWeight: 'semibold',
  },
});
const messageFeedFixesStyles = css({ height: '100%' });
const chatWindowFixesStyles = css({
  height: '100%',
});

function makeErrorMessage(message: string) {
  message = message || 'An error occurred';
  return `${message}. Try clearing the chat if the error persists.`;
}

const errorBannerWrapperStyles = css({
  margin: spacing[400],
});

export const AssistantChat: React.FunctionComponent<AssistantChatProps> = ({
  chat,
}) => {
  const track = useTelemetry();
  const darkMode = useDarkMode();
  const { messages, sendMessage, status, error, clearError } = useChat({
    chat,
    onError: (error) => {
      track('Assistant Response Failed', () => ({
        error_name: error.name,
      }));
    },
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
        track('Assistant Prompt Submitted', {
          user_input_length: trimmedMessageBody.length,
        });
        void sendMessage({ text: trimmedMessageBody });
      }
    },
    [sendMessage, track]
  );

  const handleFeedback = useCallback(
    (
      event,
      state:
        | {
            feedback: string;
            rating: string;
          }
        | {
            rating: string;
          }
        | undefined
    ) => {
      if (!state) {
        return;
      }
      const { rating } = state;
      const textFeedback = 'feedback' in state ? state.feedback : undefined;
      const feedback: 'positive' | 'negative' =
        rating === 'liked' ? 'positive' : 'negative';

      track('Assistant Feedback Submitted', {
        feedback,
        text: textFeedback,
        request_id: null,
      });
    },
    [track]
  );

  return (
    <div
      data-testid="assistant-chat"
      className={cx(
        assistantChatFixesStyles,
        assistantChatStyles,
        darkMode ? headerStyleDarkModeFixes : headerStyleLightModeFixes
      )}
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
              >
                {messageFields.isSender === false && (
                  <MessageActions
                    onRatingChange={handleFeedback}
                    onSubmitFeedback={handleFeedback}
                  />
                )}
              </Message>
            ))}
            {status === 'submitted' && (
              <Message
                id="loading"
                messageBody="Thinking..."
                isSender={false}
              />
            )}
          </MessageFeed>
          {error && (
            <div className={errorBannerWrapperStyles}>
              <Banner variant="danger" dismissible onClose={clearError}>
                {makeErrorMessage(error.message)}
              </Banner>
            </div>
          )}
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
