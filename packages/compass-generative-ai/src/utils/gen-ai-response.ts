import { AiChatbotInvalidResponseError } from '../chatbot-errors';
import { type AiQueryPrompt } from './gen-ai-prompt';
import type { LanguageModel } from 'ai';
import { streamText } from 'ai';

export async function getAiQueryResponse(
  model: LanguageModel,
  message: AiQueryPrompt,
  abortSignal: AbortSignal
): Promise<string> {
  const { instructions, requestId, analyticsId, sensitiveStorage } =
    message.metadata;
  const response = streamText({
    model,
    messages: [{ role: 'user', content: message.prompt }],
    providerOptions: {
      openai: {
        instructions,
        metadata: {
          analytics_id: analyticsId,
          sensitive_storage: sensitiveStorage,
        },
        store: false,
      },
    },
    headers: {
      'X-Client-Request-Id': requestId,
      'X-Assistant-Entrypoint': 'natural-language-to-mql',
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
