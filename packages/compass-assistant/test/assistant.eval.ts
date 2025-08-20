import { Eval } from 'braintrust';
import type { EvalCase, EvalScorer } from 'braintrust';
import { Levenshtein } from 'autoevals';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

type ConversationEvalCaseInput = {
  // TODO: we could also make this an array of messages so you can have a whole
  // conversation. but each message could then also be an object for
  // future-proofing so we can have things like the prompt type and any other
  // hidden metadata we might be passing to the chatbot along with the message
  message: string;
  // TODO: not implemented on our side yet, but apparently the chatbot supports
  // this?  I'm including this here as an example of why we'd probably have more
  // than just prompt text and expected results in our eval cases
  customSystemPrompt?: string;
};

type ConversationEvalCaseExpected = {
  // TODO: similarly we could make this an array of messages and each message
  // could be an object and...
  role: 'user' | 'assistant' | 'system';
  message: string;
};

type ConversationEvalCase = EvalCase<
  ConversationEvalCaseInput,
  ConversationEvalCaseExpected,
  unknown
> & {
  // TODO: thought of having an optional way to name the eval case in case the
  // prompt text is large. Not sure how to pass name to braintrust, though
  name?: string; // defaults to the prompt
};

type ConversationTaskOutput = {
  // again this could also be an array of messages and each message could be an
  // object for future-proofing. But we're probably just going to be taking the
  // result from the chatbot as a block of text for test purposes
  message: string;
};

type ConversationEvalScorer = EvalScorer<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>;

async function makeEvalCases(): Promise<ConversationEvalCase[]> {
  return Promise.resolve([
    {
      input: {
        message: 'How can I filter docs before running a $search query?',
      },
      expected: {
        role: 'assistant',
        message:
          'Because the $search stage must be the first stage in an aggregation pipeline, you cannot pre-filter documents with a preceding $match stage. Instead, filtering should be performed within the $search stage using the filter clause of the compound operator. This allows you to apply predicate queries (e.g., on ranges, dates, or specific terms) to narrow down the dataset before the main query clauses (must or should) are executed. Alternatively, you can filter documents by creating a View—a partial index of your collection that pre-queries and filters out unwanted documents. Note that users need createCollection privileges to build views.',
      },
      metadata: {},
    },
  ]);
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
  const result = streamText({
    model: openai.responses('mongodb-chat-latest'),
    prompt: input.message,
  });

  const chunks: string[] = [];

  // TODO: is there no one-line way to just get all the text for these cases
  // where you don't care about streaming?
  for await (const chunk of result.toUIMessageStream()) {
    const text = (chunk as any).delta || '';
    if (text) {
      chunks.push(text);
      process.stdout.write(text);
    }
  }
  return {
    message: chunks.join(''),
  };
}

function makeLevenshtein(): ConversationEvalScorer {
  return ({ output, expected }) => {
    return Levenshtein({ output: output.message, expected: expected.message });
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
