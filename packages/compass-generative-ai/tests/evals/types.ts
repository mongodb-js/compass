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

/**
 * IdlikeMethodCriterion for fields whose samples are identifier-shaped
 * strings (alphanumeric IDs, UUIDs, ObjectIds, prefixed tokens). Every
 * method here produces a fixed-width or near-fixed-width string of
 * letters/digits with no spaces — i.e. something shaped like an ID.
 */
const IDLIKE_METHODS = new Set<string>([
  'string.alphanumeric',
  'string.uuid',
  'string.nanoid',
  'string.hexadecimal',
  'database.mongodbObjectId',
  // Covers the case where the LLM invents a plausible ID list rather
  // than reaching for a structural generator.
  'helpers.arrayElement',
]);

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
 * TokenStringMethodCriterion for fields whose value is one of a
 * constrained set of short label-like tokens: enum values, unit codes,
 * type descriptors, rating codes, single-word category tokens, etc. —
 * e.g. `unitCode` (`"m"`, `"ft"`), `coverage` (`"isolated"`,
 * `"scattered"`), `rated` (`"G"`, `"PG-13"`), `@type`, `category`
 * (`"paid"`, `"promotional"`).
 *
 * A person / company / product name would be semantically wrong for
 * these fields — it would produce multi-word human-flavored strings
 * that don't resemble the small-vocabulary token the field actually
 * holds — so this criterion intentionally excludes the semantic-name
 * generators. Accepts only methods that produce short, label-shaped,
 * or structurally-constrained strings, plus `helpers.arrayElement`
 * for when the LLM invents a domain-plausible enum from the field
 * name.
 */
const TOKEN_STRING_METHODS = new Set<string>([
  // Structural string generators (fixed-shape codes, hash-like tokens)
  'string.alphanumeric',
  'string.alpha',
  'string.numeric',
  'string.uuid',
  'string.nanoid',
  'string.hexadecimal',
  // Short word-shaped tokens
  'lorem.word',
  'lorem.words',
  'lorem.slug',
  // Draw a token from an invented or provided enum
  'helpers.arrayElement',
]);

export const TokenStringMethodCriterion: EvalCriterion = {
  name: 'TokenStringMethodCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return TOKEN_STRING_METHODS.has(method);
  },
  methods: Array.from(TOKEN_STRING_METHODS),
};

/**
 * GenericStringMethodCriterion for String-typed fields whose semantics are
 * genuinely ambiguous (e.g. `customer` could be a person or a company;
 * `name` could be a product, brand, or user-chosen label;
 * `forecastOffice` could be a city or an organization). Accepts any
 * faker method that reliably produces a string value, including the
 * semantic-name generators. Strictly a superset of
 * `TokenStringMethodCriterion`.
 *
 * For fields that where semantic-name methods may be shape-wrong
 * (eg. enum / code / type-descriptor fields),
 * prefer `TokenStringMethodCriterion` instead.
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
 * LoremTextMethodCriterion for prose / multi-sentence text-content fields
 * (plots, descriptions, paragraphs, fact-like blurbs). Accepts the full
 * lorem.* family since prose fields can reasonably be words, sentences,
 * lines, or paragraphs.
 *
 * For short title-cased phrase fields (movie titles, song names), prefer
 * `ShortPhraseStringCriterion` instead — `book.title` / `music.songName`
 * fit the semantic shape and are excluded from this criterion on purpose
 * (a `plot` should not be `faker.book.title()`).
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
 * ShortPhraseStringCriterion for fields that hold a short title-cased
 * phrase (movie titles, song names, book titles). Movies, songs, and
 * books share the same semantic shape — a few title-cased words — so the
 * LLM reasonably picks `book.title` or `music.songName` for any of them.
 * Also accepts the short-lorem methods (one word / few words / one
 * sentence) since an invented phrase is shape-appropriate, and
 * `helpers.arrayElement` for when the LLM invents a plausible title list.
 */
const SHORT_PHRASE_METHODS = new Set<string>([
  'lorem.word',
  'lorem.words',
  'lorem.sentence',
  'book.title',
  'music.songName',
  'helpers.arrayElement',
]);

export const ShortPhraseStringCriterion: EvalCriterion = {
  name: 'ShortPhraseStringCriterion',
  satisfiedBy(method: unknown): boolean {
    if (typeof method !== 'string') {
      return false;
    }
    return SHORT_PHRASE_METHODS.has(method);
  },
  methods: Array.from(SHORT_PHRASE_METHODS),
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
