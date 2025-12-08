import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { init, Factuality as _Factuality } from 'autoevals';
import { Eval } from 'braintrust';
import type { EvalScorer } from 'braintrust';
import { OpenAI } from 'openai';
import { genAiUsecases } from './use-cases';

type Message = {
  content: string;
};
type InputMessage = Message & { role: 'user' | 'assistant' | 'system' };
type OutputMessage = Message;
type ExpectedMessage = OutputMessage;

type ConversationEvalCaseInput = {
  messages: InputMessage[];
  instructions: Message;
};

type ConversationEvalCaseExpected = {
  messages: OutputMessage[];
};

type ConversationTaskOutput = {
  messages: ExpectedMessage[];
};

type ConversationEvalScorer = EvalScorer<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>;

const client = new OpenAI({
  baseURL: 'https://api.braintrust.dev/v1/proxy',
  apiKey: process.env.BRAINTRUST_API_KEY,
});

init({ client });

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
  const result = streamText({
    model: openai.responses('mongodb-chat-latest'),
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
    const t = ((chunk as any).delta as string) || '';
    if (t) {
      chunks.push(t);
    }
  }
  return {
    messages: [{ content: chunks.join('') }],
  };
}

function allText(messages: Message[]): string {
  return messages.map((m) => m.text).join('\n');
}

const Factuality: ConversationEvalScorer = ({ input, output, expected }) => {
  return _Factuality({
    input: allText(input.messages),
    output: allText(output.messages),
    expected: allText(expected.messages),
    model: 'gpt-4.1',
    temperature: undefined,
  });
};

void Eval<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>('Compass Gen AI', {
  data: () => {
    return genAiUsecases.map((usecase) => {
      return {
        name: usecase.name,
        input: {
          messages: [{ content: usecase.prompt.prompt, role: 'user' }],
          instructions: { content: usecase.prompt.metadata.instructions },
        },
        expected: {
          messages: [{ content: JSON.stringify(usecase.expectedOutput) }],
        },
      };
    });
  },
  task: makeAssistantCall,
  scores: [Factuality],
});
