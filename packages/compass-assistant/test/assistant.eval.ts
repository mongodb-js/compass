/* eslint-disable no-console */
import { Eval } from 'braintrust';
import type { EvalCase, EvalScorer } from 'braintrust';
import { Levenshtein } from 'autoevals';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { evalCases } from './eval-cases';

export type SimpleEvalCase = {
  name?: string;
  input: string;
  expected: string;
};

type Message = {
  text: string;
};

type ConversationEvalCaseInput = {
  messages: Message[];
};

type ConversationEvalCaseExpected = {
  messages: Message[];
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
  messages: Message[];
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
        messages: [{ text: c.expected }],
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
  return {
    messages: [{ text }],
  };
}

function makeLevenshtein(): ConversationEvalScorer {
  return ({ output, expected }) => {
    return Levenshtein({
      output: allText(output.messages),
      expected: allText(expected.messages),
    });
  };
}

void Eval<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>('Compass Assistant', {
  data: makeEvalCases,
  task: makeAssistantCall,
  // if input, output and expected were all just text we could have just stuck
  // scorers from autoevals straight in here like [Levenshtein]. But because
  // our types are custom we need to wrap them.
  scores: [makeLevenshtein()],
});
