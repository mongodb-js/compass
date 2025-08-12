import {
  type ChatRequestOptions,
  type ChatTransport,
  type UIMessage,
  type UIMessageChunk,
  convertToModelMessages,
  streamText,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  baseURL: 'https://knowledge.staging.corp.mongodb.com/api/v1',
  apiKey: '',
});

export class DocsProviderTransport implements ChatTransport<UIMessage> {
  // eslint-disable-next-line @typescript-eslint/require-await
  async sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]) {
    const result = streamText({
      model: openai.responses('mongodb-chat-latest'),
      messages: convertToModelMessages(messages),
      abortSignal: abortSignal,
      headers: {
        origin: 'https://knowledge.staging.corp.mongodb.com',
      },
    });

    return result.toUIMessageStream();
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async reconnectToStream(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return null;
  }
}

export const docsProviderTransport = new DocsProviderTransport();
