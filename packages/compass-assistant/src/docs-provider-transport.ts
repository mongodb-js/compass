import { createOpenAI } from '@ai-sdk/openai';
import { buildPrompts } from './prompts';
import {
  type ChatTransport,
  convertToModelMessages,
  type UIMessage,
  type UIMessageChunk,
  type LanguageModel,
  type ModelMessage,
  streamText,
} from 'ai';

export class DocsProviderTransport implements ChatTransport<UIMessage> {
  private createResponse: ReturnType<typeof makeCreateResponse>;

  constructor({ baseUrl }: { baseUrl: string }) {
    const openai = createOpenAI({
      baseURL: baseUrl,
      apiKey: '',
    });
    this.createResponse = makeCreateResponse({
      languageModel: openai.responses('mongodb-chat-latest'),
    });
  }

  sendMessages({
    messages,
    // TODO: pass the metadata correctly in a strongly typed manner.
    // I'm not sure how to do this.
    metadata,
    abortSignal,
  }: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]) {
    const result = this.createResponse({
      messages: convertToModelMessages(messages),
      abortSignal,
      systemPromptType: metadata?.type as keyof typeof buildPrompts,
    });

    return Promise.resolve(result.toUIMessageStream());
  }

  reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // For this implementation, we don't support reconnecting to streams
    return Promise.resolve(null);
  }
}

export function makeCreateResponse({
  languageModel,
}: {
  languageModel: LanguageModel;
}) {
  return function createResponse({
    messages,
    abortSignal,
    systemPromptType,
    headers,
  }: {
    messages: ModelMessage[];
    abortSignal?: AbortSignal;
    systemPromptType?: keyof typeof buildPrompts;
    headers?: Record<string, string>;
  }) {
    const instructions =
      systemPromptType && buildPrompts[systemPromptType]?.system
        ? buildPrompts[systemPromptType].system
        : undefined;

    const result = streamText({
      model: languageModel,
      messages: messages,
      abortSignal: abortSignal,
      headers,
      providerOptions: {
        openai: {
          // Have to pass like this because it only accepts JSONValue (not instructions: undefined).
          ...(instructions ? { instructions } : {}),
        },
      },
    });
    return result;
  };
}
