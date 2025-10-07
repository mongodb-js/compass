import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';
import { MockDataGeneratorStep } from './types';

export const StepButtonLabelMap = {
  [MockDataGeneratorStep.SCHEMA_CONFIRMATION]: 'Confirm',
  [MockDataGeneratorStep.SCHEMA_EDITOR]: 'Next',
  [MockDataGeneratorStep.DOCUMENT_COUNT]: 'Next',
  [MockDataGeneratorStep.PREVIEW_DATA]: 'Generate Script',
  [MockDataGeneratorStep.GENERATE_DATA]: 'Done',
} as const;

export const DEFAULT_DOCUMENT_COUNT = 1000;
export const MAX_DOCUMENT_COUNT = 100000;

/**
 * Map of MongoDB types to available Faker methods.
 * Not all Faker methods are included here.
 * More can be found in the Faker.js API: https://fakerjs.dev/api/
 */
export const MONGO_TYPE_TO_FAKER_METHODS: Record<
  MongoDBFieldType,
  Array<string>
> = {
  String: [
    'lorem.word',
    'lorem.words',
    'lorem.sentence',
    'lorem.paragraph',
    'person.firstName',
    'person.lastName',
    'person.fullName',
    'person.jobTitle',
    'internet.email',
    'internet.url',
    'internet.domainName',
    'internet.userName',
    'phone.number',
    'location.city',
    'location.country',
    'location.streetAddress',
    'location.zipCode',
    'location.state',
    'company.name',
    'company.catchPhrase',
    'color.human',
    'commerce.productName',
    'commerce.department',
    'finance.accountName',
    'finance.currencyCode',
    'git.commitSha',
    'string.uuid',
    'string.alpha',
    'string.alphanumeric',
  ],
  Number: [
    'number.int',
    'number.float',
    'finance.amount',
    'location.latitude',
    'location.longitude',
  ],
  Int32: ['number.int', 'finance.amount'],
  Long: ['number.int', 'number.bigInt'],
  Decimal128: ['number.float', 'finance.amount'],
  Boolean: ['datatype.boolean'],
  Date: [
    'date.recent',
    'date.past',
    'date.future',
    'date.anytime',
    'date.birthdate',
  ],
  Timestamp: ['date.recent', 'date.past', 'date.future', 'date.anytime'],
  ObjectId: ['database.mongodbObjectId'],
  Binary: ['string.hexadecimal', 'string.binary'],
  RegExp: ['lorem.word', 'string.alpha'],
  Code: ['lorem.sentence', 'lorem.paragraph', 'git.commitMessage'],
  MinKey: ['number.int'],
  MaxKey: ['number.int'],
  Symbol: ['lorem.word', 'string.symbol'],
  DBRef: ['database.mongodbObjectId'],
};
