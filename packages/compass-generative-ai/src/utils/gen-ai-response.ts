import { AiChatbotInvalidResponseError } from '../chatbot-errors';
import { type AiQueryPrompt } from './gen-ai-prompt';
import type { LanguageModel } from 'ai';
import { streamText } from 'ai';

export async function getAiQueryResponse(
  model: LanguageModel,
  message: AiQueryPrompt,
  abortSignal: AbortSignal
): Promise<string> {
  const { instructions, requestId, ...restOfMetadata } = message.metadata;
  const response = streamText({
    model,
    messages: [{ role: 'user', content: message.prompt }],
    providerOptions: {
      openai: {
        instructions,
        metadata: restOfMetadata,
      },
    },
    headers: {
      'X-Client-Request-Id': requestId,
    },
    abortSignal,
  }).toUIMessageStream();
  const chunks: string[] = [];
  for await (const value of response) {
    if (value.type === 'text-delta') {
      chunks.push(value.delta);
    }
    if (value.type === 'error') {
      throw new AiChatbotInvalidResponseError(value.errorText);
    }
  }
  return chunks.join('');
}
