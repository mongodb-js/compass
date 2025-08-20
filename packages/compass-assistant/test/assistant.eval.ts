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
};

type Message = {
  text: string;
};
type InputMessage = Message;
type OutputMessage = Message & { sources: string[] };
type ExpectedMessage = OutputMessage;

type ConversationEvalCaseInput = {
  messages: InputMessage[];
};

type ConversationEvalCaseExpected = {
  messages: OutputMessage[];
};

type ConversationEvalCase = EvalCase<
  ConversationEvalCaseInput,
  ConversationEvalCaseExpected,
  unknown
> & {
  name: string; // defaults to the prompt
};

type ConversationTaskOutput = {
  // again this could also be an array of messages and each message could be an
  // object for future-proofing. But we're probably just going to be taking the
  // result from the chatbot as a block of text for test purposes
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

function makeEvalCases(): ConversationEvalCase[] {
  return evalCases.map((c) => {
    return {
      name: c.name ?? c.input,
      input: {
        messages: [{ text: c.input }],
      },
      expected: {
        messages: [{ text: c.expected, sources: c.expectedSources || [] }],
      },
      metadata: {},
    };
  });
}

async function makeAssistantCall(
  input: ConversationEvalCaseInput
): Promise<ConversationTaskOutput> {
  const openai = createOpenAI({
    baseURL: 'https://knowledge.staging.corp.mongodb.com/api/v1',
    apiKey: '',
    headers: {
      'User-Agent': 'mongodb-compass/x.x.x',
    },
  });
  const prompt = allText(input.messages);

  const result = streamText({
    model: openai.responses('mongodb-chat-latest'),
    temperature: 0,
    prompt,
  });

  const chunks: string[] = [];

  for await (const chunk of result.toUIMessageStream()) {
    const t = ((chunk as any).delta as string) || '';
    if (t) {
      chunks.push(t);
    }
  }
  const text = chunks.join('');

  // TODO: something up with this type
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
    temperature: 0,
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
  } else {
    // If there are no expected links, return null
    return {
      name,
      score: null,
    };
  }
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
