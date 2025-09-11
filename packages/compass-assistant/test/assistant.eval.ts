/* eslint-disable no-console */
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { init, Factuality as _Factuality } from 'autoevals';
import { Eval } from 'braintrust';
import type { EvalCase, EvalScorer } from 'braintrust';
import { OpenAI } from 'openai';
import { evalCases } from './eval-cases';
import { fuzzyLinkMatch } from './fuzzylinkmatch';
import { binaryNdcgAtK } from './binaryndcgatk';
import { makeEntrypointCases } from './entrypoints';
import { buildConversationInstructionsPrompt } from '../src/prompts';

const client = new OpenAI({
  baseURL: 'https://api.braintrust.dev/v1/proxy',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

init({ client });

export type SimpleEvalCase = {
  name?: string;
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

type Message = {
  text: string;
};
type InputMessage = Message;
type OutputMessage = Message & { sources: string[] };
type ExpectedMessage = OutputMessage;

type ConversationEvalCaseInput = {
  messages: InputMessage[];
  instructions: Message;
};

type ConversationEvalCaseExpected = {
  messages: OutputMessage[];
};

type ConversationEvalCase = EvalCase<
  ConversationEvalCaseInput,
  ConversationEvalCaseExpected,
  unknown
> & {
  name: string;
};

type ConversationTaskOutput = {
  messages: ExpectedMessage[];
};

type ConversationEvalScorer = EvalScorer<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>;

function allText(messages: Message[]): string {
  return messages.map((m) => m.text).join('\n');
}

function getChatTemperature(): number | undefined {
  if (process.env.CHAT_TEMPERATURE) {
    return parseFloat(process.env.CHAT_TEMPERATURE);
  }
  // if it is not set return undefined for the implicit default
  return undefined;
}

function getScorerTemperature(): number | undefined {
  if (process.env.SCORER_TEMPERATURE) {
    return parseFloat(process.env.SCORER_TEMPERATURE);
  }

  // if it is not set return undefined for the implicit default
  return undefined;
}

function makeEvalCases(): ConversationEvalCase[] {
  const instructions = buildConversationInstructionsPrompt({
    target: 'MongoDB Compass',
  });

  const entrypointCases: ConversationEvalCase[] = makeEntrypointCases().map(
    (c) => {
      return {
        name: c.name ?? c.input,
        input: {
          messages: [{ text: c.input }],
          instructions: { text: instructions },
        },
        expected: {
          messages: [{ text: c.expected, sources: c.expectedSources || [] }],
        },
        tags: c.tags || [],
        metadata: {},
      };
    }
  );

  const userCases: ConversationEvalCase[] = evalCases.map((c) => {
    return {
      name: c.name ?? c.input,
      input: {
        messages: [{ text: c.input }],
        instructions: { text: instructions },
      },
      expected: {
        messages: [{ text: c.expected, sources: c.expectedSources || [] }],
      },
      tags: c.tags || [],
      metadata: {},
    };
  });

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
      'User-Agent': 'mongodb-compass/x.x.x',
    },
  });
  const prompt = allText(input.messages);

  const result = streamText({
    model: openai.responses('mongodb-chat-latest'),
    temperature: getChatTemperature(),
    prompt,
    providerOptions: {
      openai: {
        instructions: input.instructions.text,
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

  const sources = resolvedSources
    .map((source) => {
      console.log(source);
      return source.url;
    })
    .filter((url) => !!url);

  return {
    messages: [{ text, sources }],
  };
}

const Factuality: ConversationEvalScorer = ({ input, output, expected }) => {
  return _Factuality({
    input: allText(input.messages),
    output: allText(output.messages),
    expected: allText(expected.messages),
    model: 'gpt-4.1',
    temperature: getScorerTemperature(),
  });
};

const BinaryNdcgAt5: ConversationEvalScorer = ({ output, expected }) => {
  const name = 'BinaryNdcgAt5';
  const k = 5;
  const outputLinks = output.messages[0].sources ?? [];
  const expectedLinks = expected.messages[0].sources;
  if (expectedLinks) {
    return {
      name,
      score: binaryNdcgAtK(expectedLinks, outputLinks, fuzzyLinkMatch, k),
    };
  }

  // if there are no expected links, just return null
  return {
    name,
    score: null,
  };
};

void Eval<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>('Compass Assistant', {
  data: makeEvalCases,
  task: makeAssistantCall,
  scores: [Factuality, BinaryNdcgAt5],
});
