import type { ToolUIPart, UIDataTypes, UIMessagePart, UITools } from 'ai';
import type { AssistantMessage } from './compass-assistant-provider';
import type { Chat } from './@ai-sdk/react/chat-react';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';

export type ToolState = 'idle' | 'running' | 'success' | 'error' | 'canceled';

// Type guard to check if a message part is a ToolUIPart
export function partIsToolUI(
  part: UIMessagePart<UIDataTypes, UITools>
): part is ToolUIPart {
  return part.type.startsWith('tool-') || 'toolCallId' in part;
}

// Map our tool call states to LeafyGreen ToolState
export function getToolState(toolCallState?: ToolUIPart['state']): ToolState {
  switch (toolCallState) {
    case 'approval-requested':
      return 'idle';
    case 'approval-responded':
      return 'running';
    case 'input-available':
      return 'running';
    case 'output-available':
      return 'success';
    case 'output-error':
      return 'error';
    case 'output-denied':
      return 'canceled';
    default:
      return 'idle';
  }
}

export async function stopChat(chat: Chat<AssistantMessage>) {
  // chat.stop() will cancel pending tool operations through its AbortSignal.
  // However, it will not update the message UI state and will actually retry sending the message by default.
  // In practice, this means it will keep re-running the tool call we're cancelling.
  // So we first set all existing tool calls to an error state before continuing with chat.stop()
  chat.messages = chat.messages.map((message): AssistantMessage => {
    const hasRunningTools = message.parts.some(
      (part) =>
        partIsToolUI(part) &&
        (part.state === 'approval-responded' ||
          part.state === 'input-available')
    );

    if (!hasRunningTools) {
      return message;
    }

    return {
      ...message,
      parts: message.parts.map((part) => {
        if (partIsToolUI(part) && getToolState(part.state) === 'running') {
          // Create a new tool part with error state
          const { ...basePart } = part;
          return {
            ...basePart,
            state: 'output-error' as const,
            output: undefined,
            errorText: 'Tool execution was cancelled',
            // This type does not resolve correctly.
          } as unknown as ToolUIPart;
        }
        return part;
      }),
    };
  });

  await chat.stop();
}

export async function getHashedActiveUserId(
  preferences: Pick<PreferencesAccess, 'getPreferences'>,
  logger: Logger
): Promise<string> {
  const { currentUserId, telemetryAnonymousId, telemetryAtlasUserId } =
    preferences.getPreferences();
  const userId = currentUserId ?? telemetryAnonymousId ?? telemetryAtlasUserId;
  if (!userId) {
    return 'unknown';
  }
  try {
    const data = new TextEncoder().encode(userId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  } catch (e) {
    logger.log.warn(
      logger.mongoLogId(1_001_000_385),
      'AtlasAiService',
      'Failed to hash user id for AI request',
      {
        error: (e as Error).message,
      }
    );
    return 'unknown';
  }
}
