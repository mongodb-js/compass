import {
  type ChatTransport,
  type LanguageModelMiddleware,
  type ToolSet,
  type UIMessageChunk,
  convertToModelMessages,
  streamText,
  toUIMessageStream,
  wrapLanguageModel,
} from 'ai';
import {
  getErrorMessage,
  type LanguageModelV4,
  type LanguageModelV4StreamPart,
} from '@ai-sdk/provider';
import type { AssistantMessage } from './compass-assistant-provider';

function parseSkillName(input: string): string | undefined {
  try {
    const { skillName } = JSON.parse(input) as { skillName?: unknown };
    return typeof skillName === 'string' ? skillName : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The server runs skills itself, but streams each one as a `skill`
 * function_call. Compass has no `skill` tool, so the AI SDK would treat these
 * as failed tool calls (logging NoSuchToolError, rendering them, and sending
 * them back in the history). This removes them from the model stream before
 * the SDK sees them and reports the skill names instead.
 */
function createSkillsMiddleware(
  onSkillUsed: (skillName: string) => void
): LanguageModelMiddleware {
  return {
    specificationVersion: 'v4',
    async wrapStream({ doStream }) {
      const { stream, ...rest } = await doStream();
      const skillToolCallIds = new Set<string>();
      const transform = new TransformStream<
        LanguageModelV4StreamPart,
        LanguageModelV4StreamPart
      >({
        transform(part, controller) {
          switch (part.type) {
            case 'tool-input-start':
              if (part.toolName === 'skill') {
                skillToolCallIds.add(part.id);
                return;
              }
              break;
            case 'tool-input-delta':
            case 'tool-input-end':
              if (skillToolCallIds.has(part.id)) {
                return;
              }
              break;
            case 'tool-call': {
              if (part.toolName === 'skill') {
                const skillName = parseSkillName(part.input);
                if (skillName) {
                  onSkillUsed(skillName);
                  // Surfaced as reasoning so the UI can show it live.
                  controller.enqueue({
                    type: 'reasoning-start',
                    id: part.toolCallId,
                  });
                  controller.enqueue({
                    type: 'reasoning-delta',
                    id: part.toolCallId,
                    delta: `Using skill: ${skillName}`,
                  });
                  controller.enqueue({
                    type: 'reasoning-end',
                    id: part.toolCallId,
                  });
                }
                return;
              }
              break;
            }
          }
          controller.enqueue(part);
        },
      });
      return { ...rest, stream: stream.pipeThrough(transform) };
    },
  };
}

/** Returns true if the message should be excluded from being sent to the assistant API. */
export function shouldExcludeMessage({ metadata }: AssistantMessage) {
  if (metadata?.confirmation) {
    return true;
  }
  return false;
}

export class DocsProviderTransport implements ChatTransport<AssistantMessage> {
  private model: LanguageModelV4;
  private origin: string;
  private getTools: () => ToolSet;
  private instructions: string;
  private getThreadId: () => string;

  constructor({
    model,
    origin,
    getTools,
    getThreadId,
    instructions,
  }: {
    model: LanguageModelV4;
    origin: string;
    getTools?: () => ToolSet;
    getThreadId: () => string;
    instructions: string;
  }) {
    this.model = model;
    this.origin = origin;
    this.getTools = getTools ?? (() => ({}));
    this.getThreadId = getThreadId;
    this.instructions = instructions;
  }

  static emptyStream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      controller.close();
    },
  });

  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<AssistantMessage>['sendMessages']>[0]) {
    // If the most recent message is a message that is meant to be excluded
    // then we do not need to send this request to the assistant API as it's likely
    // redundant otherwise.
    if (shouldExcludeMessage(messages[messages.length - 1])) {
      return Promise.resolve(DocsProviderTransport.emptyStream);
    }

    const filteredMessages = messages.filter(
      (message) => !shouldExcludeMessage(message)
    );

    // If no messages remain after filtering, return an empty stream
    if (filteredMessages.length === 0) {
      return Promise.resolve(DocsProviderTransport.emptyStream);
    }

    const lastMessage = filteredMessages[filteredMessages.length - 1];

    const disableStorage = filteredMessages.some(
      (message) => message.metadata?.disableStorage
    );

    const modelMessages = await (lastMessage.metadata?.sendWithoutHistory
      ? convertToModelMessages([lastMessage])
      : convertToModelMessages(filteredMessages));

    // EAI-1506 The chatbot API never forwards `store: true` to the OpenAI, as a
    // result even when `store: true` is set the API response does not include a
    // valid `itemId`. On client side (check
    //  https://github.com/vercel/ai/blob/610b98ed4764407d5cc2bfe64b9ad27b740e1cf9/packages/openai/src/responses/convert-to-openai-responses-input.ts#L171-L175
    // ), it converts message to { type: 'item_reference', id: itemId } to reduce the
    // payload size. This causes issues for the backend that relies on `itemId`.
    // As a workaround, we are removing the `itemId` from the providerOptions
    // before sending the messages to the model, so that the client side will not
    // convert the content to an item reference and will keep the full message content.
    const finalMessages = modelMessages.map((msg) => {
      if (msg.role === 'assistant' && Array.isArray(msg.content)) {
        // The assistant API rejects `reasoning` input items ("Unsupported
        // input type"), and the OpenAI provider drops them anyway when store is
        // false and there is no encrypted content, with a console warning.
        const content = msg.content.filter((part) => part.type !== 'reasoning');
        return {
          ...msg,
          content: content.map((part) => {
            if (!('providerOptions' in part)) {
              return part;
            }
            const itemId = part.providerOptions?.openai?.itemId;
            const newItemId =
              itemId === '0' || itemId === '' || !itemId ? undefined : itemId;
            return {
              ...part,
              providerOptions: {
                ...part.providerOptions,
                openai: {
                  ...part.providerOptions?.openai,
                  itemId: newItemId,
                },
              },
            };
          }),
        };
      }
      return msg;
    });

    const usedSkills = new Set(
      lastMessage.role === 'assistant'
        ? (lastMessage.metadata?.skillsUsed ?? [])
        : []
    );

    const tools = this.getTools();

    const result = streamText({
      model: wrapLanguageModel({
        model: this.model,
        middleware: createSkillsMiddleware((skillName) =>
          usedSkills.add(skillName)
        ),
      }),
      messages: finalMessages,
      allowSystemInMessages: true,
      abortSignal: abortSignal,
      headers: {
        'X-Request-Origin': this.origin,
        'X-Client-Request-Id': lastMessage.metadata?.requestId ?? '',
        'X-Client-Thread-Id': this.getThreadId(),
      },
      tools,
      providerOptions: {
        openai: {
          store: false,
          // If the last message has custom instructions, use them instead of the default
          instructions: lastMessage.metadata?.instructions ?? this.instructions,
          metadata: {
            analytics_id: lastMessage.metadata?.analyticsId,
            sensitive_storage: disableStorage ? 'false' : 'true',
          },
        },
      },
    });

    return Promise.resolve(
      toUIMessageStream({
        stream: result.stream,
        tools,
        sendSources: true,
        onError: getErrorMessage,
        messageMetadata() {
          const skillsMetadata =
            usedSkills.size > 0 ? { skillsUsed: [...usedSkills] } : undefined;
          if (lastMessage.metadata) {
            // Return the metadata that's relevant for telemetry tracking purposes.
            const { requestId, connectionInfo } = lastMessage.metadata;
            return {
              requestId,
              connectionInfo,
              ...skillsMetadata,
            };
          }
          return skillsMetadata;
        },
      })
    );
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}
