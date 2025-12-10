import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { OpenAI } from 'openai';
import { init } from 'autoevals';
import type {
  ConversationEvalCaseInput,
  ConversationTaskOutput,
} from './types';

const client = new OpenAI({
  baseURL: 'https://api.braintrust.dev/v1/proxy',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

init({ client });

export async function makeChatbotCall(
  input: ConversationEvalCaseInput
): Promise<ConversationTaskOutput> {
  const openai = createOpenAI({
    baseURL:
      process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE ??
      'https://knowledge.mongodb.com/api/v1',
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
