import React, { Suspense, lazy } from 'react';
import { LgChatMessage, css } from '@mongodb-js/compass-components';
import { isAtlasTool } from '@mongodb-js/compass-generative-ai/provider';
import type { AssistantMessage } from '../compass-assistant-provider';
import { getToolDisplayName, getReasoningSteps, partIsToolUI } from '../utils';
import type { ThinkingIndicator as ThinkingIndicatorType } from './skills-input';
import { ConfirmationMessage } from './confirmation-message';
import { ToolCallMessage } from './tool-call-message';
import { AtlasToolCallMessage } from './atlas-tool-call-message';
import { FollowUpPrompts, parseFollowUpQuestions } from './follow-up-prompts';

const { Message } = LgChatMessage;

// TODO(COMPASS-11250): Remove lazy loading once skills are enabled by default
// Loaded on demand so Via's bundle and CSS only ship when skills are enabled.
// webpack can't resolve the `.js` extension that tsc's nodenext resolution
// demands for dynamic imports of a `.tsx` file, so we drop it and silence tsc.
export const ThinkingIndicator = lazy(
  (): Promise<{ default: typeof ThinkingIndicatorType }> =>
    // @ts-expect-error TS2835: extensionless dynamic import, see above
    import('./skills-input').then((m) => ({ default: m.ThinkingIndicator }))
);

// On small screens, many components end up breaking words which we don't want.
// This is a general temporary fix for all components that we want to prevent from wrapping.
const noWrapFixesStyles = css({
  whiteSpace: 'nowrap',
});

export function hasThinkingBlock(message?: AssistantMessage): boolean {
  return (
    !!message &&
    !message.metadata?.confirmation &&
    getReasoningSteps(message).length > 0
  );
}

export type FeedbackState = { rating: string; feedback?: string } | undefined;

interface AssistantChatMessageProps {
  message: AssistantMessage;
  isLastMessage: boolean;
  isResponseComplete: boolean;
  isThinking: boolean;
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
    isThinking,
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
    }

    const reasoningSteps = getReasoningSteps(message);
    const toolCalls = parts.filter(partIsToolUI);

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
        {reasoningSteps.length > 0 && (
          <Suspense fallback={null}>
            <ThinkingIndicator steps={reasoningSteps} isThinking={isThinking} />
          </Suspense>
        )}
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
