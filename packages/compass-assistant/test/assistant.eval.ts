/* eslint-disable no-console */
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Eval } from 'braintrust';
import type { EvalCase } from 'braintrust';
import { OpenAI } from 'openai';
import { evalCases } from './eval-cases';
import { makeEntrypointCases } from './entrypoints';
import { buildConversationInstructionsPrompt } from '../src/prompts';
import type {
  ConversationEvalCaseInput,
  ConversationEvalCaseExpected,
  ConversationTaskOutput,
} from 'mongodb-assistant-eval/eval';
import {
  makeFactuality,
  makeBinaryNdcgAtK,
  type JudgeModelConfig,
} from 'mongodb-assistant-eval/scorers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVAL_TARGET = 'MongoDB Compass';
const EVAL_MODEL = 'mongodb-chat-latest';
const BRAINTRUST_PROXY_ENDPOINT = 'https://api.braintrust.dev/v1/proxy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SimpleEvalCase = {
  name: string;
  input: string;
  expected: string;
  expectedSources?: string[];
  tags: (
    | 'end-user-input'
    | 'connection-error'
    | 'dns-error'
    | 'explain-plan'
    | 'proactive-performance-insights'
    | 'general-network-error'
    | 'oidc'
    | 'tsl-ssl'
    | 'ssl'
    | 'model-data'
    | 'aggregation-pipeline'
    | 'atlas-search'
    | 'competitor'
    | 'mongodb-features'
    | 'compass-features'
    | 'unsupported'
  )[];
};

type CompassEvalCase = EvalCase<
  ConversationEvalCaseInput,
  ConversationEvalCaseExpected,
  unknown
> & {
  name: string;
};

// ---------------------------------------------------------------------------
// Judge model config for LLM-as-a-judge scorers
// ---------------------------------------------------------------------------

const judgeConfig: JudgeModelConfig = {
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

// ---------------------------------------------------------------------------
// Scorers
// ---------------------------------------------------------------------------

const Factuality = makeFactuality(judgeConfig);
const BinaryNdcgAt5 = makeBinaryNdcgAtK([5]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getChatTemperature(): number | undefined {
  if (process.env.CHAT_TEMPERATURE) {
    return parseFloat(process.env.CHAT_TEMPERATURE);
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Data function — convert eval cases to Braintrust format
// ---------------------------------------------------------------------------

const instructions = buildConversationInstructionsPrompt({
  target: EVAL_TARGET,
});

function makeEvalCases(): CompassEvalCase[] {
  const mapCase = (c: SimpleEvalCase): CompassEvalCase => ({
    name: c.name ?? c.input,
    input: {
      messages: [{ role: 'user', content: c.input }],
    },
    expected: {
      referenceAnswer: c.expected,
      links: c.expectedSources,
    },
    tags: c.tags || [],
    metadata: {},
  });

  const entrypointCases = makeEntrypointCases().map(mapCase);
  const userCases = evalCases.map(mapCase);

  return [...entrypointCases, ...userCases];
}

// ---------------------------------------------------------------------------
// Task function — call the assistant and capture response
// ---------------------------------------------------------------------------

async function makeAssistantCall(
  input: ConversationEvalCaseInput
): Promise<ConversationTaskOutput> {
  const openai = createOpenAI({
    baseURL:
      process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE ??
      'https://knowledge.mongodb.com/api/v1',
    apiKey: '',
    headers: {
      'X-Request-Origin': 'compass-assistant-braintrust',
      'User-Agent': 'mongodb-compass/x.x.x',
    },
  });

  const prompt = input.messages.map((m) => m.content).join('\n');

  const result = streamText({
    model: openai.responses(EVAL_MODEL),
    temperature: getChatTemperature(),
    prompt,
    providerOptions: {
      openai: {
        instructions,
        store: false,
      },
    },
  });

  const chunks: string[] = [];

  for await (const chunk of result.toUIMessageStream()) {
    const t = ((chunk as any).delta as string) || '';
    if (t) {
      chunks.push(t);
    }
  }
  const text = chunks.join('');

  // TODO: something's up with this type. url does exist on it.
  const resolvedSources = (await result.sources) as { url: string }[];

  const urls = resolvedSources
    .map((source) => source.url)
    .filter((url) => !!url);

  return {
    messages: [{ role: 'assistant', content: text }],
    assistantMessageContent: text,
    urls,
    allowedQuery: true,
  };
}

// ---------------------------------------------------------------------------
// Eval entry point
// ---------------------------------------------------------------------------

void Eval<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>('Compass Assistant', {
  data: makeEvalCases,
  task: makeAssistantCall,
  scores: [Factuality, BinaryNdcgAt5],
});
