import { OpenAI } from 'openai';
import type { JudgeModelConfig } from 'mongodb-assistant-eval/scorers';
import { buildConversationInstructionsPrompt } from '../src/prompts';

export const EVAL_TARGET = 'MongoDB Compass';
export const EVAL_MODEL = 'mongodb-chat-latest';
export const EVAL_USER_AGENT = 'mongodb-compass/x.x.x';
export const BRAINTRUST_PROXY_ENDPOINT = 'https://api.braintrust.dev/v1/proxy';

export const instructions = buildConversationInstructionsPrompt({
  target: EVAL_TARGET,
});

export const judgeConfig: JudgeModelConfig = {
  modelId: 'gpt-4.1',
  embeddingModel: 'text-embedding-3-small',
  client: new OpenAI({
    baseURL: BRAINTRUST_PROXY_ENDPOINT,
    apiKey: process.env.BRAINTRUST_API_KEY!,
  }),
  braintrustProxy: {
    apiKey: process.env.BRAINTRUST_API_KEY!,
    endpoint: BRAINTRUST_PROXY_ENDPOINT,
  },
};
