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
  getToolDisplayName,
} from '../utils';
import {
  isAtlasTool,
} from '@mongodb-js/compass-generative-ai/provider';

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
    reason?: string;
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

    const seenTitles = new Set<string>();
    const sources = [];
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

    const rawDisplayText =
      metadata?.displayText ||
      parts
        ?.filter((part) => part.type === 'text')
        .map((part) => part.text)
        .join('');

    const isSender = role === 'user';

    const parsedMessage =
      !isSender && rawDisplayText && enableSearchActivationProgramP2
        ? parseFollowUpQuestions(rawDisplayText, {
            isLastMessage,
            isResponseComplete,
          })
        : null;

    const displayText = parsedMessage
      ? parsedMessage.strippedText
      : rawDisplayText;
    const followUpQuestions = parsedMessage?.questions ?? [];

    const messageConnection = metadata?.connectionInfo ?? null;

    return (
      <>
        {toolCalls.map((toolCall, index) => {
          const toolCallId = toolCall.toolCallId || `${id}-${toolCall.type}`;

          if (isAtlasTool(getToolDisplayName(toolCall.type))) {
            return (
              <AtlasToolCallMessage
                key={`${toolCallId}-${index}`}
                toolCall={toolCall}
                connection={messageConnection}
                onApprove={(approvalId) =>
                  onToolApproval({
                    message,
                    type: toolCall.type,
                    approvalId,
                    approved: true,
                  })
                }
                onDeny={(approvalId, reason) =>
                  onToolApproval({
                    message,
                    type: toolCall.type,
                    approvalId,
                    approved: false,
                    reason,
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
              onDeny={(approvalId, reason) =>
                onToolApproval({
                  message,
                  type: toolCall.type,
                  approvalId,
                  approved: false,
                  reason,
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
            {!isSender && (
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
            {sources.length > 0 && (
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
