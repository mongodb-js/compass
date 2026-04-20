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

/**
 * NumericFieldMethodCriterion for Number-typed fields. Accepts number.int and
 * number.float. Rejects commerce.price and finance.amount which return strings.
 */
const NUMERIC_FIELD_METHODS = new Set<string>(['number.int', 'number.float']);

export const NumericFieldMethodCriterion: EvalCriterion = {
  name: 'NumericFieldMethodCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return NUMERIC_FIELD_METHODS.has(method);
  },
  methods: Array.from(NUMERIC_FIELD_METHODS),
};

/**
 * GenericStringMethodCriterion for String-typed fields with no semantic hints
 * (mainly "no sample values" variants). Accepts any faker method that
 * reliably produces a string value. For a field we can't disambiguate,
 * the mock-data quality bar is "plausible string" and any of these methods
 * clears it. Arg-value correctness when sampleValues *are* provided is
 * independently enforced by FakerSampleValueAccuracy.
 */
const GENERIC_STRING_METHODS = new Set<string>([
  // Structural string generators
  'string.alphanumeric',
  'string.alpha',
  'string.numeric',
  'string.uuid',
  'string.nanoid',
  'string.hexadecimal',
  // Lorem text
  'lorem.word',
  'lorem.words',
  'lorem.slug',
  'lorem.sentence',
  // Drawing from an invented or provided enum
  'helpers.arrayElement',
  // Common semantic string methods the LLM reasonably picks when it can
  // read meaning from the field name (e.g. `customer` → person/company;
  // `name` → product name; `category` → department). All of these return
  // strings.
  'person.firstName',
  'person.lastName',
  'person.fullName',
  'person.jobTitle',
  'company.name',
  'company.catchPhrase',
  'company.buzzPhrase',
  'commerce.productName',
  'commerce.department',
  'commerce.product',
  'internet.userName',
  'internet.displayName',
  'internet.domainName',
  'book.title',
  'music.songName',
  'food.dish',
  'hacker.phrase',
]);

export const GenericStringMethodCriterion: EvalCriterion = {
  name: 'GenericStringMethodCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return GENERIC_STRING_METHODS.has(method);
  },
  methods: Array.from(GENERIC_STRING_METHODS),
};

/**
 * LoremTextMethodCriterion for text-content fields (titles, plots, paragraphs,
 * descriptions). Accepts the full range of lorem.* methods since text fields
 * can reasonably be represented as words, sentences, lines, or paragraphs.
 */
const LOREM_TEXT_METHODS = new Set<string>([
  'lorem.word',
  'lorem.words',
  'lorem.sentence',
  'lorem.sentences',
  'lorem.paragraph',
  'lorem.paragraphs',
  'lorem.lines',
  'lorem.text',
]);

export const LoremTextMethodCriterion: EvalCriterion = {
  name: 'LoremTextMethodCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return LOREM_TEXT_METHODS.has(method);
  },
  methods: Array.from(LOREM_TEXT_METHODS),
};

/**
 * SecondaryAddressCriterion accepts location.secondaryAddress and
 * string.alphanumeric.
 */
const SECONDARY_ADDRESS_METHODS = new Set<string>([
  'location.secondaryAddress',
  'string.alphanumeric',
]);

export const SecondaryAddressCriterion: EvalCriterion = {
  name: 'SecondaryAddressCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return SECONDARY_ADDRESS_METHODS.has(method);
  },
  methods: Array.from(SECONDARY_ADDRESS_METHODS),
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
