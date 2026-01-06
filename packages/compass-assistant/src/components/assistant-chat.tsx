import React, { useCallback, useEffect, useContext, useRef } from 'react';
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
  Icon,
} from '@mongodb-js/compass-components';
import { ConfirmationMessage } from './confirmation-message';
import { ToolCallMessage } from './tool-call-message';
import type { ToolCallPart } from './tool-call-message';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { NON_GENUINE_WARNING_MESSAGE } from '../preset-messages';
import { SuggestedPrompts } from './suggested-prompts';
import { ToolToggle } from './tool-toggle';
import { usePreference } from 'compass-preferences-model/provider';

const { ChatWindow } = LgChatChatWindow;
const { LeafyGreenChatProvider } = LgChatLeafygreenChatProvider;
const { Message } = LgChatMessage;
const { InputBar } = LgChatInputBar;

interface AssistantChatProps {
  chat: Chat<AssistantMessage>;
  hasNonGenuineConnections: boolean;
}

export type SendMessageOptions = {
  text: string;
  metadata?: AssistantMessage['metadata'];
};

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

const chatContainerOverrideStyle = {
  height: '100%',
  width: '100%',
};

const messageFeedFixesStyles = css({
  display: 'flex',
  flexDirection: 'column-reverse',
  overflowY: 'auto',
  wordBreak: 'break-word',
  padding: spacing[400],
  gap: spacing[400],
  width: '100%',

  // TODO(COMPASS-9751): We're setting the font weight to 600 here as the LG styling for the Assistant header isn't set
  '& > div > div > div:has(svg[aria-label="Sparkle Icon"]) p': {
    fontWeight: 600,
  },
});
const welcomeMessageStyles = css({
  paddingBottom: spacing[400],
  paddingLeft: spacing[400],
  paddingRight: spacing[400],
});
// On small screens, many components end up breaking words which we don't want.
// This is a general temporary fix for all components that we want to prevent from wrapping.
const noWrapFixesStyles = css({
  whiteSpace: 'nowrap',
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

const sparkleIconOverrideStyle = {
  color: palette.green.dark1,
};

const inputBarTextareaProps = {
  placeholder: 'Ask a question',
};

const toolToggleContainerStyles = css({
  paddingLeft: spacing[50],
  paddingRight: spacing[50],
});

export const AssistantChat: React.FunctionComponent<AssistantChatProps> = ({
  chat,
  hasNonGenuineConnections,
}) => {
  const track = useTelemetry();
  const darkMode = useDarkMode();
  const isToolCallingEnabled = usePreference('enableToolCalling');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousLastMessageId = useRef<string | undefined>(undefined);
  const { id: lastMessageId, role: lastMessageRole } =
    chat.messages[chat.messages.length - 1] ?? {};

  const { ensureOptInAndSend } = useContext(AssistantActionsContext);
  const {
    messages,
    status,
    error,
    clearError,
    setMessages,
    addToolApprovalResponse,
  } = useChat({
    chat,
  });

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      // Since the container uses flexDirection: 'column-reverse',
      // scrolling to the bottom means setting scrollTop to 0
      messagesContainerRef.current.scrollTop = 0;
    }
  }, []);

  useEffect(() => {
    if (
      lastMessageId &&
      previousLastMessageId.current !== undefined &&
      lastMessageId !== previousLastMessageId.current &&
      lastMessageRole === 'user'
    ) {
      scrollToBottom();
    }
    previousLastMessageId.current = lastMessageId;
  }, [lastMessageId, lastMessageRole, scrollToBottom]);

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
    async ({ text, metadata }: SendMessageOptions) => {
      const trimmedMessageBody = text.trim();
      if (trimmedMessageBody) {
        await chat.stop();
        void ensureOptInAndSend?.(
          {
            text: trimmedMessageBody,
            metadata: { sendContext: true, ...metadata },
          },
          {},
          () => {
            track('Assistant Prompt Submitted', {
              user_input_length: trimmedMessageBody.length,
            });
          }
        );
      }
    },
    [track, ensureOptInAndSend, chat]
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
    [ensureOptInAndSend, setMessages, track]
  );

  const handleToolApproval = useCallback(
    (approvalId: string, approved: boolean) => {
      void addToolApprovalResponse({
        id: approvalId,
        approved,
      });

      track('Assistant Tool Call Approval', {
        approved,
        approval_id: approvalId,
      });
    },
    [addToolApprovalResponse, track]
  );

  const visibleMessages = messages.filter(
    (message) => !message.metadata?.isSystemContext
  );

  return (
    <div
      data-testid="assistant-chat"
      className={cx(
        assistantChatFixesStyles,
        darkMode ? assistantChatFixesDarkStyles : assistantChatFixesLightStyles
      )}
      style={chatContainerOverrideStyle}
    >
      <LeafyGreenChatProvider>
        <ChatWindow>
          <div
            data-testid="assistant-chat-messages"
            className={messageFeedFixesStyles}
            ref={messagesContainerRef}
          >
            <div className={messagesWrapStyles}>
              {visibleMessages.map((message, index) => {
                const { id, role, metadata, parts } = message;
                const seenTitles = new Set<string>();
                const sources = [];
                const toolCalls: ToolCallPart[] = [];

                for (const part of parts) {
                  // Related sources are type source-url. We want to only
                  // include url_citation (has url and title), not file_citation
                  // (no url or title).
                  if (part.type === 'source-url' && part.url && part.title) {
                    if (!seenTitles.has(part.title)) {
                      seenTitles.add(part.title);
                      sources.push({
                        children: part.title,
                        href: part.url,
                        variant: 'Docs',
                      });
                    }
                  }

                  // Detect tool call parts (they have a "tool-" prefix or a toolCallId)
                  if (part.type.startsWith('tool-') || 'toolCallId' in part) {
                    toolCalls.push(part as ToolCallPart);
                  }
                }

                // Handle confirmation messages
                if (metadata?.confirmation) {
                  const { description, state } = metadata.confirmation;
                  const isLastMessage = index === visibleMessages.length - 1;

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

                // Render tool calls and text content together
                return (
                  <React.Fragment key={id}>
                    {/* Show tool calls if present */}
                    {toolCalls.map((toolCall, index) => {
                      const toolCallId =
                        toolCall.toolCallId ||
                        `${id}-${toolCall.type}-${index}`;

                      return (
                        <ToolCallMessage
                          key={toolCallId}
                          toolCall={toolCall}
                          onApprove={(approvalId) =>
                            handleToolApproval(approvalId, true)
                          }
                          onDeny={(approvalId) =>
                            handleToolApproval(approvalId, false)
                          }
                        />
                      );
                    })}
                    {/* Show text message if there's text content */}
                    {displayText && (
                      <Message
                        key={`${id}-text`}
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
                            className={noWrapFixesStyles}
                          />
                        )}
                        {sources.length > 0 && (
                          <Message.Links
                            className={noWrapFixesStyles}
                            links={sources}
                          />
                        )}
                      </Message>
                    )}
                  </React.Fragment>
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
                  style={sparkleIconOverrideStyle}
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
          <SuggestedPrompts chat={chat} onMessageSend={handleMessageSend} />

          <InputBar
            data-testid="assistant-chat-input"
            onMessageSend={(text) => void handleMessageSend({ text })}
            state={status === 'submitted' ? 'loading' : undefined}
            textareaProps={inputBarTextareaProps}
            onClickStopButton={() => void chat.stop()}
          >
            {isToolCallingEnabled && (
              <InputBar.AdditionalActions>
                <div className={toolToggleContainerStyles}>
                  <ToolToggle />
                </div>
              </InputBar.AdditionalActions>
            )}
          </InputBar>
        </ChatWindow>
      </LeafyGreenChatProvider>
    </div>
  );
};
