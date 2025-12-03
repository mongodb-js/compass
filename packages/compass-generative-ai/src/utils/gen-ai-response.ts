import { AiChatbotInvalidResponseError } from '../chatbot-errors';
import { type AiQueryPrompt } from './gen-ai-prompt';
import type { LanguageModel } from 'ai';
import { streamText } from 'ai';

export async function getAiQueryResponse(
  model: LanguageModel,
  message: AiQueryPrompt,
  abortSignal: AbortSignal
): Promise<string> {
  const response = streamText({
    model,
    messages: [{ role: 'user', content: message.prompt }],
    providerOptions: {
      openai: {
        store: false,
        instructions: message.metadata.instructions,
      },
    },
    abortSignal,
  }).toUIMessageStream();
  const chunks: string[] = [];
  let done = false;
  const reader = response.getReader();
  while (!done) {
    const { done: _done, value } = await reader.read();
    if (_done) {
      done = true;
      break;
    }
    if (value.type === 'text-delta') {
      chunks.push(value.delta);
    }
    if (value.type === 'error') {
      throw new AiChatbotInvalidResponseError(value.errorText);
    }
  }
  return chunks.join('');
}
