import {
  type ChatTransport,
  type LanguageModel,
  type ToolSet,
  type UIMessageChunk,
  convertToModelMessages,
  streamText,
} from 'ai';
import type { AssistantMessage } from './compass-assistant-provider';

/** Returns true if the message should be excluded from being sent to the assistant API. */
export function shouldExcludeMessage({ metadata }: AssistantMessage) {
  if (metadata?.confirmation) {
    return true;
  }
  return false;
}

export class DocsProviderTransport implements ChatTransport<AssistantMessage> {
  private model: LanguageModel;
  private origin: string;
  private getTools: () => ToolSet;
  private instructions: string;

  constructor({
    model,
    origin,
    getTools,
    instructions,
  }: {
    model: LanguageModel;
    origin: string;
    getTools?: () => ToolSet;
    instructions: string;
  }) {
    this.model = model;
    this.origin = origin;
    this.getTools = getTools ?? (() => ({}));
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
        const content = msg.content;
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
    const result = streamText({
      model: this.model,
      messages: finalMessages,
      abortSignal: abortSignal,
      headers: {
        'X-Request-Origin': this.origin,
        'X-Client-Request-Id': lastMessage.metadata?.requestId ?? '',
      },
      tools: this.getTools(),
      providerOptions: {
        openai: {
          store: !disableStorage,
          // If the last message has custom instructions, use them instead of the default
          instructions: lastMessage.metadata?.instructions ?? this.instructions,
          metadata: {
            userId: lastMessage.metadata?.userId,
          },
        },
      },
    });

    return Promise.resolve(
      result.toUIMessageStream({
        sendSources: true,
        messageMetadata() {
          if (lastMessage.metadata) {
            // Return the metadata that's relevant for telemetry tracking purposes.
            const { requestId, connectionInfo } = lastMessage.metadata;
            return {
              requestId,
              connectionInfo,
            };
          }
        },
      })
    );
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}
