import { OpenAI } from 'openai';
import type { JudgeModelConfig } from 'mongodb-assistant-eval/scorers';
import { buildConversationInstructionsPrompt } from '../src/prompts';

export const EVAL_TARGET = 'MongoDB Compass';
export const EVAL_MODEL = 'mongodb-chat-latest';
export const EVAL_USER_AGENT = 'mongodb-compass/x.x.x';
export const BRAINTRUST_PROXY_ENDPOINT = 'https://api.braintrust.dev/v1/proxy';
export const EVAL_CLUSTER_UID = 'eval-test-cluster';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required to run Compass Assistant evals`);
  }
  return value;
}

const braintrustApiKey = requireEnv('BRAINTRUST_API_KEY');

export const instructions = buildConversationInstructionsPrompt({
  target: EVAL_TARGET,
});

export const judgeConfig: JudgeModelConfig = {
  modelId: 'gpt-4.1',
  embeddingModel: 'text-embedding-3-small',
  client: new OpenAI({
    baseURL: BRAINTRUST_PROXY_ENDPOINT,
    apiKey: braintrustApiKey,
  }),
  braintrustProxy: {
    apiKey: braintrustApiKey,
    endpoint: BRAINTRUST_PROXY_ENDPOINT,
  },
};
