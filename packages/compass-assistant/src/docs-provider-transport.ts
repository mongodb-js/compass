import {
  type ChatTransport,
  type UIMessage,
  type UIMessageChunk,
  convertToModelMessages,
  streamText,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export class DocsProviderTransport implements ChatTransport<UIMessage> {
  private openai: ReturnType<typeof createOpenAI>;

  constructor({ baseUrl }: { baseUrl: string }) {
    this.openai = createOpenAI({
      baseURL: baseUrl,
      apiKey: '',
    });
  }

  sendMessages({
    messages,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]) {
    const result = streamText({
      model: this.openai.responses('mongodb-chat-latest'),
      messages: convertToModelMessages(messages),
      abortSignal: abortSignal,
    });

    return Promise.resolve(result.toUIMessageStream());
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}
