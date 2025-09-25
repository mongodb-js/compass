import React, { useCallback, useEffect, useContext } from 'react';
import type { AssistantMessage } from '../compass-assistant-provider';
import { AssistantActionsContext } from '../compass-assistant-provider';
import type { Chat } from '../@ai-sdk/react/chat-react';
import { useChat } from '../@ai-sdk/react/use-chat';
import {
  LgChatChatWindow,
  LgChatLeafygreenChatProvider,
  LgChatMessage,
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
  Icon,
} from '@mongodb-js/compass-components';
import { ConfirmationMessage } from './confirmation-message';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { NON_GENUINE_WARNING_MESSAGE } from '../preset-messages';

const { DisclaimerText } = LgChatChatDisclaimer;
const { ChatWindow } = LgChatChatWindow;
const { LeafyGreenChatProvider, Variant } = LgChatLeafygreenChatProvider;
const { Message } = LgChatMessage;
const { InputBar } = LgChatInputBar;

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

interface AssistantChatProps {
  chat: Chat<AssistantMessage>;
  hasNonGenuineConnections: boolean;
}

// TODO(COMPASS-9751): These are temporary patches to make the Assistant chat take the entire
// width and height of the drawer since Leafygreen doesn't support this yet.
const assistantChatFixesStyles = css({
  // Compass has a global bullet point override but we clear this for the chat.
  ul: {
    listStyleType: 'disc',
  },
  ol: {
    listStyleType: 'decimal',
  },

  // Remove extra padding
  '> div, > div > div, > div > div > div, > div > div > div': {
    height: '100%',
    padding: 0,
  },
  // This is currently set to 'pre-wrap' which causes list items to be on a different line than the list markers.
  'li, ol': {
    whiteSpace: 'normal',
  },
  /** TODO(COMPASS-9751): We're adjusting styling of all the headers to a lower level than the default for chat, this should be updated in Leafygreen as well and removed from our end. */
  'h1, h2, h3, h4, h5, h6': {
    fontFamily: fontFamilies.default,
    margin: 'unset',
  },
  /** h4, h5, h6 -> body 1 styling */
  'h4, h5, h6': {
    fontSize: '13px',
    lineHeight: '15px',
    marginTop: '4px',
    // DE has reset css that sets all font weights to 400
    fontWeight: 700,
  },
  /** h1 -> h3 styling */
  h1: {
    fontSize: '20px',
    marginTop: '8px',
    fontWeight: 'medium',
    lineHeight: '22px',
  },
  /** h2 -> subtitle styling */
  h2: {
    color: '#001E2B',
    fontWeight: 'semibold',
    fontSize: '18px',
    lineHeight: '20px',
    marginTop: '8px',
  },
  /** h3 -> body 2 styling */
  h3: {
    fontSize: '16px',
    fontWeight: 'semibold',
    lineHeight: '18px',
    marginTop: '4px',
  },
  blockquote: {
    // remove the 3x line height that these take up by default
    lineHeight: 0,
    margin: 0,
    borderLeftWidth: spacing[100],
    borderLeftStyle: 'solid',
    padding: `0 0 0 ${spacing[200]}px`,

    '> * + *': {
      margin: `${spacing[400]}px 0 0`,
    },
  },
  hr: {
    // hr tags have no width when it is alone in a chat message because of the
    // overall layout in chat where the chat bubble sizes to fit the content.
    // The minimum width of the drawer sized down to the smallest size leaves
    // 200px.
    minWidth: '200px',
  },
});

const assistantChatFixesDarkStyles = css({
  'h1, h2, h3, h4, h5, h6': {
    color: palette.gray.light2,
  },
  blockquote: {
    borderLeftColor: palette.gray.light1,
  },
});

const assistantChatFixesLightStyles = css({
  'h1, h2, h3, h4, h5, h6': {
    color: palette.black,
  },
  blockquote: {
    borderLeftColor: palette.gray.dark1,
  },
});

const messageFeedFixesStyles = css({
  display: 'flex',
  flexDirection: 'column-reverse',
  overflowY: 'auto',
  width: '100%',
  wordBreak: 'break-word',
  flex: 1,
  padding: spacing[400],
  gap: spacing[400],

  // TODO(COMPASS-9751): We're setting the font weight to 600 here as the LG styling for the Assistant header isn't set
  '& > div > div > div:has(svg[aria-label="Sparkle Icon"]) p': {
    fontWeight: 600,
  },
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
  paddingBottom: spacing[400],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  a: {
    fontSize: 'inherit',
  },
});
// We do not want the "Learn More (Icon)" to end up split up across multiple lines.
const disclaimerLinkFixesStyles = css({
  whiteSpace: 'nowrap',
});
// Submit button text should not wrap.
const messageActionsFixesStyles = css({
  whiteSpace: 'nowrap',
});

/** TODO(COMPASS-9751): This should be handled by Leafygreen's disclaimers update */
const inputBarStyleFixes = css({
  width: '100%',
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
  paddingBottom: spacing[100],
});

function makeErrorMessage(message: string) {
  message = message || 'An error occurred';
  return `${message}. Try clearing the chat if the error persists.`;
}

const errorBannerWrapperStyles = css({
  margin: spacing[400],
});

const messagesWrapStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const welcomeHeadingStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  span: {
    fontWeight: 600,
    lineHeight: '20px',
  },
});
const welcomeTextStyles = css({
  margin: `${spacing[100]}px 0 0 0`,
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
    ({
      state,
      message,
    }: {
      message: AssistantMessage;
      state:
        | {
            feedback: string;
            rating: string;
          }
        | {
            rating: string;
          }
        | undefined;
    }) => {
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
        source: message.metadata?.source ?? 'chat response',
      });
    },
    [track]
  );

  const handleConfirmation = useCallback(
    (
      confirmedMessage: AssistantMessage,
      newState: 'confirmed' | 'rejected'
    ) => {
      setMessages((messages) => {
        const newMessages: AssistantMessage[] = messages.map((message) => {
          if (
            message.id === confirmedMessage.id &&
            message.metadata?.confirmation
          ) {
            return {
              ...message,
              metadata: {
                ...message.metadata,
                confirmation: {
                  ...message.metadata.confirmation,
                  state: newState,
                },
              },
            };
          }
          return message;
        });

        // If confirmed, add a new message with the same content but without confirmation metadata
        if (newState === 'confirmed') {
          newMessages.push({
            ...confirmedMessage,
            id: `${confirmedMessage.id}-confirmed`,
            metadata: {
              ...confirmedMessage.metadata,
              confirmation: undefined,
            },
          });
        }
        return newMessages;
      });
      track('Assistant Confirmation Submitted', {
        status: newState,
        source: confirmedMessage.metadata?.source ?? 'chat response',
      });
      if (newState === 'confirmed') {
        // Force the new message request to be sent
        void ensureOptInAndSend?.(undefined, {}, () => {});
      }
    },
    [ensureOptInAndSend, setMessages]
  );

  return (
    <div
      data-testid="assistant-chat"
      className={cx(
        assistantChatFixesStyles,
        darkMode ? assistantChatFixesDarkStyles : assistantChatFixesLightStyles
      )}
      style={{ height: '100%', width: '100%' }}
    >
      <LeafyGreenChatProvider variant={Variant.Compact}>
        <ChatWindow title="MongoDB Assistant" className={chatWindowFixesStyles}>
          <div
            data-testid="assistant-chat-messages"
            className={messageFeedFixesStyles}
          >
            <div className={messagesWrapStyles}>
              {messages.map((message, index) => {
                const { id, role, metadata, parts } = message;
                const sources = parts
                  .filter((part) => part.type === 'source-url')
                  .map((part) => ({
                    children: part.title || 'Documentation Link',
                    href: part.url,
                    variant: 'Docs',
                  }));
                if (metadata?.confirmation) {
                  const { description, state } = metadata.confirmation;
                  const isLastMessage = index === messages.length - 1;

                  return (
                    <ConfirmationMessage
                      key={id}
                      // Show as rejected if it's not the last message
                      state={
                        !isLastMessage && state === 'pending'
                          ? 'rejected'
                          : state
                      }
                      title="Please confirm your request"
                      description={description}
                      onConfirm={() => handleConfirmation(message, 'confirmed')}
                      onReject={() => handleConfirmation(message, 'rejected')}
                    />
                  );
                }

                const displayText =
                  message.metadata?.displayText ||
                  message.parts
                    ?.filter((part) => part.type === 'text')
                    .map((part) => part.text)
                    .join('');

                const isSender = role === 'user';

                return (
                  <Message
                    key={id}
                    sourceType="markdown"
                    isSender={isSender}
                    messageBody={displayText}
                    data-testid={`assistant-message-${id}`}
                  >
                    {isSender === false && (
                      <Message.Actions
                        onRatingChange={(event, state) =>
                          handleFeedback({ message, state })
                        }
                        onSubmitFeedback={(event, state) =>
                          handleFeedback({ message, state })
                        }
                        className={messageActionsFixesStyles}
                      />
                    )}
                    {sources.length > 0 && <Message.Links links={sources} />}
                  </Message>
                );
              })}
            </div>
          </div>
          {error && (
            <div className={errorBannerWrapperStyles}>
              <Banner variant="danger" dismissible onClose={clearError}>
                {makeErrorMessage(error.message)}
              </Banner>
            </div>
          )}
          {messages.length === 0 && (
            <div className={welcomeMessageStyles}>
              <h4 className={welcomeHeadingStyles}>
                <Icon
                  glyph="Sparkle"
                  size="large"
                  style={{ color: palette.green.dark1 }}
                />
                <span>MongoDB Assistant</span>
              </h4>
              <p className={welcomeTextStyles}>
                Welcome to the MongoDB Assistant!
                <br />
                Ask any question about MongoDB to receive expert guidance and
                documentation.
              </p>
            </div>
          )}
          <div className={inputBarStyleFixes}>
            <InputBar
              data-testid="assistant-chat-input"
              onMessageSend={handleMessageSend}
              state={status === 'submitted' ? 'loading' : undefined}
              textareaProps={{
                placeholder: 'Ask a question',
              }}
            />
          </div>
          <DisclaimerText className={disclaimerTextStyles}>
            AI can make mistakes. Review for accuracy.{' '}
            <Link
              className={disclaimerLinkFixesStyles}
              hideExternalIcon={false}
              href={GEN_AI_FAQ_LINK}
              target="_blank"
            >
              Learn more
            </Link>
          </DisclaimerText>
        </ChatWindow>
      </LeafyGreenChatProvider>
    </div>
  );
};
