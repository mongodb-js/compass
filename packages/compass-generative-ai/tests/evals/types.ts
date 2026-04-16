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

export const UNRECOGNIZED_METHOD = 'unrecognized';

/**
 * EvalCriterion is a standardized interface that `FakerMethodSuggestionAccuracy` scorer can
 * use to determine if a field satisfies a general condition, or criterion, that exact-equality
 * is not sufficient for.
 */
export interface EvalCriterion {
  readonly name: string;
  satisfiedBy(method: unknown): boolean;
  methods: Array<string>;
}

const DATELIKE_METHODS = new Set<string>([
  'date.anytime',
  'date.past',
  'date.recent',
  'date.soon',
  'date.future',
  'date.between',
]);

export const DatelikeMethodCriterion: EvalCriterion = {
  name: 'DatelikeMethodCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return DATELIKE_METHODS.has(method);
  },
  methods: Array.from(DATELIKE_METHODS),
};

const IDLIKE_METHODS = new Set<string>(['string.alphanumeric', 'string.uuid']);

export const IdlikeMethodCriterion: EvalCriterion = {
  name: 'IdlikeMethodCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return IDLIKE_METHODS.has(method);
  },
  methods: Array.from(IDLIKE_METHODS),
};

export const isEvalCriterion = (method: unknown): method is EvalCriterion => {
  return (
    typeof method === 'object' &&
    method !== null &&
    typeof (method as { satisfiedBy?: unknown }).satisfiedBy === 'function' &&
    typeof (method as { name?: unknown }).name === 'string'
  );
};

export interface MockDataInputFieldSchema {
  [key: string]: {
    type: string;
    probability: number;
    sampleValues?: Array<unknown>;
  };
}

export type FakerArgument = string | number | boolean | { json: string };

export interface LlmCompletedField {
  fakerArgs: Array<FakerArgument>;
  fakerMethod: string;
  fieldPath: string;
}

export interface MockDataGeneratorEvalInput {
  providedSchema: MockDataInputFieldSchema;
}

export interface MockDataGeneratorEvalOutput {
  response: {
    errorType?: 'UNEXPECTED_EVAL_ERROR';
    fields: Array<LlmCompletedField>;
  };
}

export interface MockDataGeneratorMetadata extends Record<string, unknown> {
  name: string;
  hasSampleValues: boolean;
}

export type MockDataGeneratorExpectedField = Omit<
  LlmCompletedField,
  'fakerMethod'
> & {
  fakerMethod: string | EvalCriterion;
};

export interface MockDataGeneratorExpected {
  response: {
    fields: Array<MockDataGeneratorExpectedField>;
  };
}

export interface FieldMismatch {
  field: string;
  expected: string;
  generated: string;
}

export interface ScorerMetadata extends Record<string, unknown> {
  totalFields: number;
  matches: number;
  missingFields: Array<string>;
  fieldMismatches: Array<FieldMismatch>;
}

export interface MockDataGeneratorCaseConfig {
  providedSchema: MockDataInputFieldSchema;
  expectedResponse: MockDataGeneratorExpected['response'];
  metadata: MockDataGeneratorMetadata;
}

export type MockDataGeneratorEvalScorer = EvalScorer<
  MockDataGeneratorEvalInput,
  MockDataGeneratorEvalOutput,
  MockDataGeneratorExpected
>;
