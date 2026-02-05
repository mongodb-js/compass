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

    const disbleStorage = filteredMessages.some(
      (message) => message.metadata?.disbleStorage
    );

    const result = streamText({
      model: this.model,
      messages: await (lastMessage.metadata?.sendWithoutHistory
        ? convertToModelMessages([lastMessage])
        : convertToModelMessages(filteredMessages)),
      abortSignal: abortSignal,
      headers: {
        'X-Request-Origin': this.origin,
      },
      tools: this.getTools(),
      providerOptions: {
        openai: {
          store: !disbleStorage,
          // If the last message has custom instructions, use them instead of the default
          instructions: lastMessage.metadata?.instructions ?? this.instructions,
        },
      },
    });

    return Promise.resolve(result.toUIMessageStream({ sendSources: true }));
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}
