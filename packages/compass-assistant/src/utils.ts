import type {
  ChatStatus,
  ToolUIPart,
  UIDataTypes,
  UIMessagePart,
  UITools,
} from 'ai';
import type { AssistantMessage } from './compass-assistant-provider';
import type { Chat } from './@ai-sdk/react/chat-react';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import type { Logger } from '@mongodb-js/compass-logging/provider';

export type ToolState = 'idle' | 'running' | 'success' | 'error' | 'canceled';

// Type guard to check if a message part is an approval request
export function partIsApprovalRequest(
  part: UIMessagePart<UIDataTypes, UITools>
): part is ToolUIPart & { approval: { id: string } } {
  if (!partIsToolUI(part) || part.state !== 'approval-requested') {
    return false;
  }
  const approval = (part as ToolUIPart & { approval?: unknown }).approval;
  return (
    typeof approval === 'object' &&
    approval !== null &&
    'id' in approval &&
    typeof (approval as { id: unknown }).id === 'string'
  );
}

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

  const wasActive = chat.status === 'streaming' || chat.status === 'submitted';

  await chat.stop();

  if (!wasActive) {
    return;
  }

  // chat.stop() fires the abort signal but returns immediately without
  // waiting for the stream pipeline to fully terminate. Wait for
  // makeRequest to catch the abort and set status to 'ready', otherwise
  // the stream's internal job queue can push buffered chunks back after
  // the caller clears messages.
  // Note: status can change asynchronously between the check above and
  // here (e.g. stop() may have already resolved the abort), so we
  // re-check at runtime.
  if (
    (chat.status as string) !== 'ready' &&
    (chat.status as string) !== 'error'
  ) {
    await new Promise<void>((resolve) => {
      const unsubscribe = chat['~registerStatusCallback'](() => {
        if (chat.status === 'ready' || chat.status === 'error') {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  // Allow any final in-flight job executor writes to settle. The executor
  // uses microtasks internally so yielding to the macrotask queue ensures
  // they have all completed.
  await new Promise((resolve) => setTimeout(resolve, 0));
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
      logger.mongoLogId(1_001_000_417),
      'Assistant',
      'Failed to hash user id for AI request',
      {
        error: (e as Error).message,
      }
    );
    return 'unknown';
  }
}

function isToolRunning(messages: AssistantMessage[]): boolean {
  // Check if there are any running tools
  return messages.some((message) => {
    return message.parts.some((part) => {
      if (partIsToolUI(part)) {
        const toolState = getToolState(part.state);
        return toolState === 'running';
      }
      return false;
    });
  });
}

export function isAssistantThinking(
  status: ChatStatus,
  messages: AssistantMessage[]
): boolean {
  if (status === 'submitted') {
    // we sent the message, but the response hasn't started streaming yet
    return true;
  }

  if (status === 'streaming') {
    if (messages.length === 0) {
      // no messages have even started to arrive yet
      return true;
    }

    const message = messages[messages.length - 1];

    if (message.role === 'user') {
      // the assistant's response hasn't started to arrive yet
      return true;
    }

    if (message.parts.length === 0) {
      // the assistant's response message has been created but it doesn't have
      // any content yet
      return true;
    }

    const part = message.parts[message.parts.length - 1];

    if (part.type === 'step-start') {
      // a new step has started but it doesn't have any content yet
      return true;
    }

    if (partIsToolUI(part)) {
      // a tool UI part is present, but it hasn't fully arrived yet (because
      // we're still streaming), so keep waiting
      return true;
    }

    if (part.type === 'text' && part.text.trim() === '') {
      // we got the start of the text response, but there's no text to display
      // yet, so keep waiting until something at least shows up
      return true;
    }

    // enough text should have arrived for us to at least start showing
    // something to the user, so we can stop showing the thinking state now
    return false;
  }

  if (isToolRunning(messages)) {
    // a tool call is executing
    return true;
  }

  // assume that we're in a state where we're waiting for user input or busy
  // streaming a response so we don't want to be showing the thinking state.
  // (the design calls for only showing it when we're waiting for the response
  // to start arriving)
  return false;
}

export function cleanToolCallOutput(output: unknown): unknown {
  // The MCP server's tool call output contains { content, structuredContent }.
  // content is a very raw representation containing the very verbose "The
  // following section contains unverified user data." pattern.
  // structuredContent is the same stuff and probably what we want to keep
  if (isStructuredOutput(output)) {
    const obj = { ...output };
    delete obj.content;
    return obj;
  }
  return output;
}

function isStructuredOutput(
  output: unknown
): output is { content: unknown; structuredContent: unknown } {
  if (typeof output === 'object' && output !== null) {
    return 'content' in output && 'structuredContent' in output;
  }
  return false;
}
