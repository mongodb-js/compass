import React from 'react';
import type { AssistantMessage } from '../compass-assistant-provider';
import { LgChatMessage, css } from '@mongodb-js/compass-components';
import { ConfirmationMessage } from './confirmation-message';
import { ToolCallMessage } from './tool-call-message';
import { AtlasToolCallMessage } from './atlas-tool-call-message';
import { FollowUpPrompts, parseFollowUpQuestions } from './follow-up-prompts';
import type { ToolUIPart } from 'ai';
import {
  partIsToolUI,
  ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE,
} from '../utils';

const { Message } = LgChatMessage;

// On small screens, many components end up breaking words which we don't want.
// This is a general temporary fix for all components that we want to prevent from wrapping.
const noWrapFixesStyles = css({
  whiteSpace: 'nowrap',
});

export type FeedbackState = { rating: string; feedback?: string } | undefined;

interface AssistantChatMessageProps {
  message: AssistantMessage;
  isLastMessage: boolean;
  isResponseComplete: boolean;
  enableSearchActivationProgramP2: boolean;
  onFeedback: (options: {
    message: AssistantMessage;
    state: FeedbackState;
  }) => void;
  onConfirmation: (
    message: AssistantMessage,
    newState: 'confirmed' | 'rejected'
  ) => void;
  onToolApproval: (options: {
    message: AssistantMessage;
    type: string;
    approvalId: string;
    approved: boolean;
  }) => void;
  onFollowUpSend: (text: string) => void;
}

/**
 * Memoized so streaming only re-renders the message being streamed.
 */
export const AssistantChatMessage: React.FunctionComponent<AssistantChatMessageProps> =
  React.memo(function AssistantChatMessage({
    message,
    isLastMessage,
    isResponseComplete,
    enableSearchActivationProgramP2,
    onFeedback,
    onConfirmation,
    onToolApproval,
    onFollowUpSend,
  }) {
    const { id, role, metadata, parts } = message;

    const isSender = role === 'user';

    const { sources, toolCalls } = React.useMemo(() => {
      const seenTitles = new Set<string>();
      const sources: { children: string; href: string; variant: string }[] = [];
      const toolCalls: ToolUIPart[] = [];

      for (const part of parts) {
        // file_citation sources have no url or title, so are not renderable.
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

        if (partIsToolUI(part)) {
          toolCalls.push(part);
        }
      }

      return { sources, toolCalls };
    }, [parts]);

    const rawDisplayText = React.useMemo(
      () =>
        metadata?.displayText ||
        parts
          ?.filter((part) => part.type === 'text')
          .map((part) => part.text)
          .join(''),
      [metadata?.displayText, parts]
    );

    const parsedMessage = React.useMemo(
      () =>
        !isSender && rawDisplayText && enableSearchActivationProgramP2
          ? parseFollowUpQuestions(rawDisplayText, {
              isLastMessage,
              isResponseComplete,
            })
          : null,
      [
        isSender,
        rawDisplayText,
        enableSearchActivationProgramP2,
        isLastMessage,
        isResponseComplete,
      ]
    );

    if (metadata?.confirmation) {
      const { description, state } = metadata.confirmation;

      return (
        <ConfirmationMessage
          // Show as rejected if it's not the last message
          state={!isLastMessage && state === 'pending' ? 'rejected' : state}
          title="Please confirm your request"
          description={description}
          onConfirm={() => onConfirmation(message, 'confirmed')}
          onReject={() => onConfirmation(message, 'rejected')}
        />
      );
    }

    const displayText = parsedMessage
      ? parsedMessage.strippedText
      : rawDisplayText;
    const followUpQuestions = parsedMessage?.questions ?? [];

    const messageConnection = metadata?.connectionInfo ?? null;

    const isMessageComplete = !isLastMessage || isResponseComplete;

    return (
      <>
        {toolCalls.map((toolCall, index) => {
          const toolCallId = toolCall.toolCallId || `${id}-${toolCall.type}`;

          if (toolCall.type === ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE) {
            return (
              <AtlasToolCallMessage
                key={`${toolCallId}-${index}`}
                toolCall={toolCall}
                onApprove={(approvalId, approved) =>
                  onToolApproval({
                    message,
                    type: toolCall.type,
                    approvalId,
                    approved,
                  })
                }
                onDeny={(approvalId) =>
                  onToolApproval({
                    message,
                    type: toolCall.type,
                    approvalId,
                    approved: false,
                  })
                }
              />
            );
          }

          return (
            <ToolCallMessage
              connection={messageConnection}
              key={`${toolCallId}-${index}`}
              toolCall={toolCall}
              onApprove={(approvalId) =>
                onToolApproval({
                  message,
                  type: toolCall.type,
                  approvalId,
                  approved: true,
                })
              }
              onDeny={(approvalId) =>
                onToolApproval({
                  message,
                  type: toolCall.type,
                  approvalId,
                  approved: false,
                })
              }
            />
          );
        })}
        {displayText && (
          <Message
            sourceType="markdown"
            isSender={isSender}
            messageBody={displayText}
            data-role={role}
            data-testid={`assistant-message-${id}`}
          >
            {!isSender && isMessageComplete && (
              <Message.Actions
                onRatingChange={(event, state) =>
                  onFeedback({ message, state })
                }
                onSubmitFeedback={(event, state) =>
                  onFeedback({ message, state })
                }
                className={noWrapFixesStyles}
              />
            )}
            {sources.length > 0 && isMessageComplete && (
              <Message.Links className={noWrapFixesStyles} links={sources} />
            )}
          </Message>
        )}
        {followUpQuestions.length > 0 && (
          <FollowUpPrompts
            questions={followUpQuestions}
            onSend={onFollowUpSend}
          />
        )}
      </>
    );
  });
