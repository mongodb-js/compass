/* eslint-disable no-console */
import { createOpenAI } from '@ai-sdk/openai';
import { defaultSettingsMiddleware, wrapLanguageModel } from 'ai';
import { init, Factuality as _Factuality } from 'autoevals';
import { Eval, BraintrustMiddleware } from 'braintrust';
import type { EvalCase, EvalScorer } from 'braintrust';
import { OpenAI } from 'openai';
import { evalCases } from './eval-cases';
import { fuzzyLinkMatch } from './fuzzylinkmatch';
import { binaryNdcgAtK } from './binaryndcgatk';
import { makeEntrypointCases } from './entrypoints';
import { makeCreateResponse } from '../src/docs-provider-transport';
import { type buildPrompts } from '../src/prompts';

const client = new OpenAI({
  baseURL: 'https://api.braintrust.dev/v1/proxy',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

init({ client });

export type SimpleEvalCase = {
  name?: string;
  input: string;
  /**
   * Include this in eval cases where you want to test the custom system prompt behavior.
   */
  systemPromptType?: keyof typeof buildPrompts;
  expected: string;
  expectedSources?: string[];
  tags?: string[];
};

type Message = {
  text: string;
};
type InputMessage = Message;
type OutputMessage = Message & { sources: string[] };
type ExpectedMessage = OutputMessage;

type ConversationEvalCaseInput = {
  messages: InputMessage[];
  systemPromptType?: keyof typeof buildPrompts;
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

const createResponse = makeCreateResponse({
  languageModel: wrapLanguageModel({
    model: createOpenAI({
      baseURL:
        process.env.COMPASS_ASSISTANT_BASE_URL_OVERRIDE ??
        'https://knowledge.staging.corp.mongodb.com/api/v1',
      apiKey: '',
      headers: { 'User-Agent': 'mongodb-compass/x.x.x' },
    }).responses('mongodb-chat-latest'),
    middleware: [
      // Traces calls to Assistant API
      BraintrustMiddleware({
        debug: true,
      }),
      defaultSettingsMiddleware({
        settings: {
          temperature: getChatTemperature(),
        },
      }),
    ],
  }),
});

function makeEvalCases(): ConversationEvalCase[] {
  const entrypointCases: ConversationEvalCase[] = makeEntrypointCases();

  const userCases: ConversationEvalCase[] = evalCases.map((c) => {
    return {
      name: c.name ?? c.input,
      input: {
        messages: [{ text: c.input }],
      },
      expected: {
        messages: [{ text: c.expected, sources: c.expectedSources || [] }],
      },
      tags: c.tags ?? [],
      metadata: {},
    };
  });

  return [...entrypointCases, ...userCases];
}

async function makeAssistantCall(
  input: ConversationEvalCaseInput
): Promise<ConversationTaskOutput> {
  const prompt = allText(input.messages);

  const result = createResponse({
    messages: [{ content: prompt, role: 'user' }],
    systemPromptType: input.systemPromptType,
  });
  const text = await result.text;
  // TODO: validate that this works as expected. If not, we must pull the sources out of the stream
  const sources = (await result.sources).map((source) => {
    return source.id;
  });

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
