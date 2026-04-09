import type { EvalScorer } from 'braintrust';

export type Message = {
  content: string;
};
type InputMessage = Message & { role: 'user' };
type OutputMessage = Message;
type ExpectedMessage = OutputMessage;

export type ConversationEvalCaseInput = {
  messages: InputMessage[];
  instructions: Message;
};

export type ConversationEvalCaseExpected = {
  messages: OutputMessage[];
};

export type ConversationTaskOutput = {
  messages: ExpectedMessage[];
};

export type ConversationEvalScorer = EvalScorer<
  ConversationEvalCaseInput,
  ConversationTaskOutput,
  ConversationEvalCaseExpected
>;

// --- Mock Data Generator eval types ---

import type {
  RawSchema,
  MockDataSchemaToolOutput,
} from '../../src/mock-data-generator';

export type MockDataEvalCaseInput = {
  databaseName: string;
  collectionName: string;
  schema: RawSchema;
  validationRules?: Record<string, unknown> | null;
};

export type MockDataTaskOutput = MockDataSchemaToolOutput;

export type MockDataEvalCaseExpected = {
  fieldMappings: Array<{
    fieldPath: string;
    acceptableMethods: string[]; // regex patterns
  }>;
};

export type MockDataEvalScorer = EvalScorer<
  MockDataEvalCaseInput,
  MockDataTaskOutput,
  MockDataEvalCaseExpected
>;
