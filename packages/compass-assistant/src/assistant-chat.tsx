import React, { useCallback, useEffect, useContext } from 'react';
import type { AssistantMessage } from './compass-assistant-provider';
import { AssistantActionsContext } from './compass-assistant-provider';
import type { Chat } from './@ai-sdk/react/chat-react';
import { useChat } from './@ai-sdk/react/use-chat';
import {
  LgChatChatWindow,
  LgChatLeafygreenChatProvider,
  LgChatMessage,
  LgChatMessageActions,
  LgChatInputBar,
  spacing,
  css,
  Banner,
  cx,
  fontFamilies,
  palette,
  useDarkMode,
  LgChatChatDisclaimer,
  Link,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { NON_GENUINE_WARNING_MESSAGE } from './preset-messages';

const { DisclaimerText } = LgChatChatDisclaimer;
const { ChatWindow } = LgChatChatWindow;
const { LeafyGreenChatProvider, Variant } = LgChatLeafygreenChatProvider;
const { Message } = LgChatMessage;
const { MessageActions } = LgChatMessageActions;
const { InputBar } = LgChatInputBar;

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

interface AssistantChatProps {
  chat: Chat<AssistantMessage>;
  hasNonGenuineConnections: boolean;
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
const messageFeedFixesStyles = css({
  display: 'flex',
  flexDirection: 'column-reverse',
  overflowY: 'auto',
  flex: 1,
  padding: spacing[400],
});
const chatWindowFixesStyles = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});
const welcomeMessageStyles = css({
  paddingBottom: spacing[400],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});
const disclaimerTextStyles = css({
  marginTop: spacing[400],
  marginBottom: spacing[400],
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
  hasNonGenuineConnections,
}) => {
  const track = useTelemetry();
  const darkMode = useDarkMode();

  const { ensureOptInAndSend } = useContext(AssistantActionsContext);
  const { messages, status, error, clearError, setMessages } = useChat({
    chat,
    onError: (error) => {
      track('Assistant Response Failed', () => ({
        error_name: error.name,
      }));
    },
  });

  useEffect(() => {
    const hasExistingNonGenuineWarning = chat.messages.some(
      (message) => message.id === 'non-genuine-warning'
    );
    if (hasNonGenuineConnections && !hasExistingNonGenuineWarning) {
      setMessages((messages) => {
        return [NON_GENUINE_WARNING_MESSAGE, ...messages];
      });
    } else if (hasExistingNonGenuineWarning && !hasNonGenuineConnections) {
      setMessages((messages) => {
        return messages.filter(
          (message) => message.id !== 'non-genuine-warning'
        );
      });
    }
  }, [hasNonGenuineConnections, chat, setMessages]);

  // Transform AI SDK messages to LeafyGreen chat format and reverse the order of the messages
  // for displaying it correctly with flex-direction: column-reverse.
  const lgMessages = messages
    .map((message) => ({
      id: message.id,
      messageBody:
        message.metadata?.displayText ||
        message.parts
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(''),
      isSender: message.role === 'user',
    }))
    .reverse();

  const handleMessageSend = useCallback(
    (messageBody: string) => {
      const trimmedMessageBody = messageBody.trim();
      if (trimmedMessageBody) {
        void ensureOptInAndSend?.({ text: trimmedMessageBody }, {}, () => {
          track('Assistant Prompt Submitted', {
            user_input_length: trimmedMessageBody.length,
          });
        });
      }
    },
    [track, ensureOptInAndSend]
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
          <div
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
            <DisclaimerText className={disclaimerTextStyles}>
              This feature is powered by generative AI. See our{' '}
              <Link
                hideExternalIcon={false}
                href={GEN_AI_FAQ_LINK}
                target="_blank"
              >
                FAQ
              </Link>{' '}
              for more information. Please review the outputs carefully.
            </DisclaimerText>
          </div>
          {error && (
            <div className={errorBannerWrapperStyles}>
              <Banner variant="danger" dismissible onClose={clearError}>
                {makeErrorMessage(error.message)}
              </Banner>
            </div>
          )}
          {lgMessages.length === 0 && (
            <div className={welcomeMessageStyles}>
              <h4>Welcome to your MongoDB Assistant.</h4>
              Ask any question about MongoDB to receive expert guidance and
              documentation right in your window.
            </div>
          )}
          <InputBar
            data-testid="assistant-chat-input"
            onMessageSend={handleMessageSend}
            state={status === 'submitted' ? 'loading' : undefined}
            textareaProps={{
              placeholder: 'Ask MongoDB Assistant a question',
            }}
          />
        </ChatWindow>
      </LeafyGreenChatProvider>
    </div>
  );
};
