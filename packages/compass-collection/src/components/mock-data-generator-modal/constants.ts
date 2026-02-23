import type { MockDataGeneratorStep } from './types';
import { MockDataGeneratorSteps } from './types';
import type { MongoDBFieldType } from '../../schema-analysis-types';

export const StepButtonLabelMap = {
  [MockDataGeneratorSteps.SCHEMA_CONFIRMATION]: 'Confirm',
  [MockDataGeneratorSteps.PREVIEW_AND_DOC_COUNT]: 'Generate Script',
  [MockDataGeneratorSteps.SCRIPT_RESULT]: 'Done',
} as const;

// Map of the current mock data generator step to the next step or 'finish' if the user is on the last step.
// For the purposes of telemetry tracking the step progression in the modal.
export const MOCK_DATA_GENERATOR_STEP_TO_NEXT_STEP_MAP: Readonly<
  Record<MockDataGeneratorStep, MockDataGeneratorStep | 'finish'>
> = {
  [MockDataGeneratorSteps.SCHEMA_CONFIRMATION]:
    MockDataGeneratorSteps.PREVIEW_AND_DOC_COUNT,
  [MockDataGeneratorSteps.PREVIEW_AND_DOC_COUNT]:
    MockDataGeneratorSteps.SCRIPT_RESULT,
  [MockDataGeneratorSteps.SCRIPT_RESULT]: 'finish',
};

export const DEFAULT_DOCUMENT_COUNT = 1000;
export const MAX_DOCUMENT_COUNT = 100000;

export const MongoDBFieldTypeValues: MongoDBFieldType[] = [
  'String',
  'Number',
  'Boolean',
  'Date',
  'Int32',
  'Decimal128',
  'Long',
  'ObjectId',
  'RegExp',
  'Symbol',
  'MaxKey',
  'MinKey',
  'Binary',
  'Code',
  'Timestamp',
  'DBRef',
];

/**
 * Map of MongoDB types to available Faker v9 methods.
 * Not all Faker methods are included here.
 * More can be found in the Faker.js API: https://v9.fakerjs.dev/api/
 */
export const MONGO_TYPE_TO_FAKER_METHODS: Readonly<
  Record<MongoDBFieldType, Array<{ method: string; description?: string }>>
> = {
  String: [
    { method: 'lorem.word', description: 'Single word' },
    { method: 'lorem.words', description: 'Multiple words' },
    { method: 'lorem.sentence', description: 'Short sentence' },
    { method: 'lorem.paragraph', description: 'Paragraph of text' },
    { method: 'person.firstName' },
    { method: 'person.lastName' },
    { method: 'person.fullName' },
    { method: 'person.jobTitle' },
    {
      method: 'internet.displayName',
      description: 'Username-style display name',
    },
    { method: 'internet.email' },
    { method: 'internet.emoji' },
    { method: 'internet.password', description: 'Randomly generated password' },
    { method: 'internet.url' },
    { method: 'internet.domainName' },
    { method: 'internet.userName' },
    { method: 'phone.number' },
    { method: 'location.city' },
    { method: 'location.country' },
    { method: 'location.streetAddress' },
    { method: 'location.zipCode' },
    { method: 'location.state' },
    { method: 'company.name' },
    {
      method: 'company.catchPhrase',
      description: 'Corporate-style marketing slogan',
    },
    { method: 'color.human', description: 'Human-readable color name' },
    {
      method: 'commerce.productName',
      description: 'Product name from a commerce catalog',
    },
    {
      method: 'commerce.department',
      description: 'Commerce category or department name',
    },
    {
      method: 'finance.accountName',
      description: 'Financial account type or name',
    },
    {
      method: 'finance.currencyCode',
      description: 'ISO 4217 currency code like USD or EUR',
    },
    { method: 'git.commitSha', description: 'Git commit SHA hash' },
    { method: 'string.uuid' },
    { method: 'string.alpha', description: 'Alphabetic string' },
    { method: 'string.alphanumeric', description: 'Alphanumeric string' },
    {
      method: 'system.fileName',
      description: 'File name with optional extension',
    },
    { method: 'system.filePath', description: 'System-like file path' },
    {
      method: 'system.mimeType',
      description: 'MIME type string like image/png',
    },
    { method: 'book.title' },
    { method: 'music.songName' },
    { method: 'food.dish' },
    { method: 'animal.type' },
    { method: 'vehicle.model' },
    { method: 'hacker.phrase', description: 'Hacker-style phrase' },
    {
      method: 'science.chemicalElement',
      description: 'Chemical element with name and symbol',
    },
  ],

  Number: [
    { method: 'number.binary', description: 'Binary number string' },
    { method: 'number.octal', description: 'Octal number string' },
    { method: 'number.hex', description: 'Hexadecimal number string' },
    { method: 'commerce.price', description: 'Monetary price with decimals' },
    { method: 'date.weekday', description: 'Day of the week' },
    { method: 'internet.port', description: 'Network port number' },
    { method: 'number.int' },
    { method: 'number.float' },
    {
      method: 'finance.amount',
      description: 'Monetary amount as number or string',
    },
    { method: 'location.latitude' },
    { method: 'location.longitude' },
  ],

  Int32: [
    { method: 'number.int' },
    { method: 'finance.amount', description: 'Monetary amount as integer' },
  ],

  Long: [
    { method: 'number.int' },
    { method: 'number.bigInt', description: 'Large integer value as bigint' },
  ],

  Decimal128: [
    { method: 'number.float' },
    { method: 'finance.amount', description: 'Decimal-style monetary amount' },
  ],

  Boolean: [{ method: 'datatype.boolean' }],

  Date: [
    { method: 'date.recent', description: 'Date within the last few days' },
    { method: 'date.past', description: 'Past date relative to now' },
    { method: 'date.future', description: 'Future date relative to now' },
    { method: 'date.anytime', description: 'Date at any time in history' },
    { method: 'date.birthdate' },
  ],

  Timestamp: [
    { method: 'date.recent' },
    { method: 'date.past' },
    { method: 'date.future' },
    { method: 'date.anytime' },
  ],

  ObjectId: [
    {
      method: 'database.mongodbObjectId',
      description: 'Valid MongoDB ObjectId string',
    },
  ],

  Binary: [
    {
      method: 'string.hexadecimal',
      description: 'Hexadecimal string representation',
    },
    { method: 'string.binary', description: 'Binary string representation' },
  ],

  RegExp: [{ method: 'lorem.word' }, { method: 'string.alpha' }],

  Code: [
    {
      method: 'lorem.sentence',
      description: 'Short line of code',
    },
    { method: 'lorem.paragraph', description: 'Block of placeholder code' },
    { method: 'git.commitMessage', description: 'Git-style commit message' },
  ],

  MinKey: [
    {
      method: 'number.int',
      description: 'Integer representing minimal key value',
    },
  ],

  MaxKey: [
    {
      method: 'number.int',
      description: 'Integer representing maximal key value',
    },
  ],

  Symbol: [
    { method: 'lorem.word' },
    {
      method: 'string.symbol',
      description: 'Symbol character such as punctuation or currency',
    },
  ],

  DBRef: [{ method: 'database.mongodbObjectId' }],
};

export const DEFAULT_CONNECTION_STRING_FALLBACK = '<connection-string>';
