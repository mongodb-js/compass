import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type {
  ConversationEvalCaseInput,
  ConversationTaskOutput,
} from './types';

export async function makeChatbotCall(
  input: ConversationEvalCaseInput
): Promise<ConversationTaskOutput> {
  const openai = createOpenAI({
    baseURL:
      process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE ??
      'https://eval.knowledge-dev.mongodb.com/api/v1',
    apiKey: '',
    headers: {
      'X-Request-Origin': 'compass-gen-ai-braintrust',
      'User-Agent': 'mongodb-compass/x.x.x',
    },
  });
  const result = streamText({
    model: openai.responses('mongodb-slim-latest'),
    temperature: undefined,
    prompt: input.messages,
    providerOptions: {
      openai: {
        instructions: input.instructions.content,
        store: false,
      },
    },
  });

  const chunks: string[] = [];
  for await (const chunk of result.toUIMessageStream()) {
    if (chunk.type === 'text-delta') {
      chunks.push(chunk.delta);
    }
  }
  return {
    messages: [{ content: chunks.join('') }],
  };
}
