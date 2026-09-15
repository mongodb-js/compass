import React from 'react';
import type { AssistantMessage } from '../compass-assistant-provider';
import { LgChatMessage, css } from '@mongodb-js/compass-components';
import { ConfirmationMessage } from './confirmation-message';
import { ToolCallMessage } from './tool-call-message';
import { AtlasToolCallMessage } from './atlas-tool-call-message';
import { FollowUpPrompts, parseFollowUpQuestions } from './follow-up-prompts';
import type { ToolUIPart } from 'ai';
import { partIsToolUI } from '../utils';

const { Message } = LgChatMessage;

// Temporary fix for components that break words on small screens.
const noWrapFixesStyles = css({
  whiteSpace: 'nowrap',
});

const ATLAS_CONNECTION_ERROR_DEBUGGER_TOOL_TYPE =
  'tool-atlas-connection-error-debugger';

export type FeedbackState = { rating: string; feedback?: string } | undefined;

/** Matches a fence line, capturing anything following the fence characters. */
const CODE_FENCE_LINE = /^[ \t]*(?:`{3,}|~{3,})(.*)$/gm;

/**
 * Drops the language from a code fence that has not been closed yet, so it
 * renders as plain lines until the fence closes. `@leafygreen-ui/code` re-runs
 * highlight.js over the whole block on every change, making a streaming fence
 * O(n^2); it also warns once per update on a half-streamed language name.
 *
 * Fences are paired by counting, so one inside an indented code block can pair
 * with the wrong line. The only cost is highlighting we would have deferred.
 */
export function stripOpenFenceLanguage(text: string): string {
  let openFence: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  CODE_FENCE_LINE.lastIndex = 0;
  while ((match = CODE_FENCE_LINE.exec(text)) !== null) {
    openFence = openFence ? null : match;
  }

  const language = openFence?.[1];
  if (!openFence || !language) {
    return text;
  }

  const languageStart = openFence.index + openFence[0].length - language.length;
  return (
    text.slice(0, languageStart) + text.slice(languageStart + language.length)
  );
}

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

    const parsedText = parsedMessage
      ? parsedMessage.strippedText
      : rawDisplayText;
    const isStreaming = !isSender && isLastMessage && !isResponseComplete;
    const displayText = isStreaming
      ? stripOpenFenceLanguage(parsedText)
      : parsedText;
    const followUpQuestions = parsedMessage?.questions ?? [];

    const messageConnection = metadata?.connectionInfo ?? null;

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
