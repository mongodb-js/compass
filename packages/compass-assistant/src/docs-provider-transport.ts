import {
  type ChatTransport,
  type UIMessageChunk,
  convertToModelMessages,
  streamText,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { AssistantMessage } from './compass-assistant-provider';

/** Returns true if the message should be excluded from being sent to the assistant API. */
export function shouldExcludeMessage({ metadata }: AssistantMessage) {
  if (metadata?.confirmation) {
    return metadata.confirmation.state !== 'confirmed';
  }
  return false;
}

export class DocsProviderTransport implements ChatTransport<AssistantMessage> {
  private openai: ReturnType<typeof createOpenAI>;
  private instructions: string;

  constructor({
    baseUrl,
    instructions,
  }: {
    baseUrl: string;
    instructions: string;
  }) {
    this.openai = createOpenAI({
      baseURL: baseUrl,
      apiKey: '',
    });
    this.instructions = instructions;
  }

  static emptyStream = new ReadableStream<UIMessageChunk>({
    start(controller) {
      controller.close();
    },
  });

  sendMessages({
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

    const result = streamText({
      model: this.openai.responses('mongodb-chat-latest'),
      messages: convertToModelMessages(filteredMessages),
      abortSignal: abortSignal,
      providerOptions: {
        openai: {
          instructions: this.instructions,
        },
      },
    });

    return Promise.resolve(result.toUIMessageStream());
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}
