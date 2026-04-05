/* eslint-disable no-console */
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { Eval } from 'braintrust';
import type { EvalCase } from 'braintrust';
import { evalCases } from './eval-cases';
import { makeEntrypointCases } from './entrypoints';
import type {
  ConversationEvalCaseInput,
  ConversationEvalCaseExpected,
  ConversationTaskOutput,
} from 'mongodb-assistant-eval/eval';
import {
  makeFactuality,
  makeBinaryNdcgAtK,
} from 'mongodb-assistant-eval/scorers';

import { EVAL_MODEL, instructions, judgeConfig } from './eval-config';

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

const Factuality = makeFactuality(judgeConfig);
const BinaryNdcgAt5 = makeBinaryNdcgAtK([5]);

function getChatTemperature(): number | undefined {
  if (process.env.CHAT_TEMPERATURE) {
    return parseFloat(process.env.CHAT_TEMPERATURE);
  }
  return undefined;
}

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

  const text = await result.text;

  const resolvedSources = await result.sources;
  const urls: string[] = [];
  for (const source of resolvedSources) {
    if (source.sourceType === 'url') {
      urls.push(source.url);
    }
  }

  return {
    messages: [{ role: 'assistant', content: text }],
    assistantMessageContent: text,
    urls,
    allowedQuery: true,
  };
}

void Eval<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>('Compass Assistant', {
  data: makeEvalCases,
  task: makeAssistantCall,
  scores: [Factuality, BinaryNdcgAt5],
});
