import type { MockDataEvalCaseInput, MockDataEvalCaseExpected } from '../types';
import type { RawSchema } from '../../../src/mock-data-generator';

type MockDataUseCase = {
  name: string;
  tags: string[];
  input: MockDataEvalCaseInput;
  expected: MockDataEvalCaseExpected;
};

const basicTypes: MockDataUseCase = {
  name: 'basic-types',
  tags: ['basic', 'types'],
  input: {
    databaseName: 'testdb',
    collectionName: 'users',
    schema: {
      _id: { type: 'ObjectId' },
      name: { type: 'string', sampleValues: ['Alice', 'Bob', 'Charlie'] },
      age: { type: 'number', sampleValues: [25, 30, 42] },
      isActive: { type: 'boolean' },
      createdAt: { type: 'Date' },
    },
  },
  expected: {
    fieldMappings: [
      { fieldPath: '_id', acceptableMethods: ['database\\.mongodbObjectId'] },
      {
        fieldPath: 'name',
        acceptableMethods: [
          'person\\.(firstName|lastName|fullName)',
          'helpers\\.arrayElement',
        ],
      },
      { fieldPath: 'age', acceptableMethods: ['number\\.int'] },
      { fieldPath: 'isActive', acceptableMethods: ['datatype\\.boolean'] },
      {
        fieldPath: 'createdAt',
        acceptableMethods: [
          'date\\.(recent|past|future|anytime|soon|between|birthdate)',
        ],
      },
    ],
  },
};

const semanticFields: MockDataUseCase = {
  name: 'semantic-fields',
  tags: ['semantic'],
  input: {
    databaseName: 'testdb',
    collectionName: 'contacts',
    schema: {
      email: {
        type: 'string',
        sampleValues: ['alice@example.com', 'bob@test.org'],
      },
      phone: {
        type: 'string',
        sampleValues: ['+1-555-0100', '+1-555-0199'],
      },
      firstName: { type: 'string', sampleValues: ['Alice', 'Bob'] },
      lastName: { type: 'string', sampleValues: ['Smith', 'Johnson'] },
      city: {
        type: 'string',
        sampleValues: ['New York', 'London', 'Tokyo'],
      },
      website: {
        type: 'string',
        sampleValues: ['https://example.com', 'https://test.org'],
      },
      company: {
        type: 'string',
        sampleValues: ['Acme Corp', 'Widget Inc'],
      },
    },
  },
  expected: {
    fieldMappings: [
      { fieldPath: 'email', acceptableMethods: ['internet\\.email'] },
      { fieldPath: 'phone', acceptableMethods: ['phone\\.number'] },
      { fieldPath: 'firstName', acceptableMethods: ['person\\.firstName'] },
      { fieldPath: 'lastName', acceptableMethods: ['person\\.lastName'] },
      { fieldPath: 'city', acceptableMethods: ['location\\.city'] },
      { fieldPath: 'website', acceptableMethods: ['internet\\.url'] },
      { fieldPath: 'company', acceptableMethods: ['company\\.name'] },
    ],
  },
};

const mongodbSpecific: MockDataUseCase = {
  name: 'mongodb-specific',
  tags: ['mongodb'],
  input: {
    databaseName: 'testdb',
    collectionName: 'events',
    schema: {
      _id: { type: 'ObjectId' },
      userId: {
        type: 'ObjectId',
        sampleValues: ['507f1f77bcf86cd799439011'],
      },
      createdAt: { type: 'Date' },
      updatedAt: { type: 'Date' },
      version: { type: 'Long', sampleValues: [1, 2, 3] },
    },
  },
  expected: {
    fieldMappings: [
      { fieldPath: '_id', acceptableMethods: ['database\\.mongodbObjectId'] },
      {
        fieldPath: 'userId',
        acceptableMethods: ['database\\.mongodbObjectId'],
      },
      {
        fieldPath: 'createdAt',
        acceptableMethods: [
          'date\\.(recent|past|future|anytime|soon|between|birthdate)',
        ],
      },
      {
        fieldPath: 'updatedAt',
        acceptableMethods: [
          'date\\.(recent|past|future|anytime|soon|between|birthdate)',
        ],
      },
      {
        fieldPath: 'version',
        acceptableMethods: ['number\\.(int|bigInt)'],
      },
    ],
  },
};

const nestedStructures: MockDataUseCase = {
  name: 'nested-structures',
  tags: ['nested', 'arrays'],
  input: {
    databaseName: 'testdb',
    collectionName: 'addresses',
    schema: {
      'address.street': {
        type: 'string',
        sampleValues: ['123 Main St', '456 Oak Ave'],
      },
      'address.city': {
        type: 'string',
        sampleValues: ['New York', 'Boston'],
      },
      'address.zipCode': { type: 'string', sampleValues: ['10001', '02101'] },
      'tags[]': {
        type: 'string',
        sampleValues: ['urgent', 'review', 'pending'],
      },
      'scores[]': { type: 'number', sampleValues: [95, 87, 73] },
    },
  },
  expected: {
    fieldMappings: [
      {
        fieldPath: 'address.street',
        acceptableMethods: [
          'location\\.(streetAddress|street)',
          'location\\.streetAddress',
        ],
      },
      { fieldPath: 'address.city', acceptableMethods: ['location\\.city'] },
      {
        fieldPath: 'address.zipCode',
        acceptableMethods: ['location\\.zipCode'],
      },
      {
        fieldPath: 'tags[]',
        acceptableMethods: [
          'helpers\\.(arrayElement|arrayElements)',
          'lorem\\.word',
        ],
      },
      {
        fieldPath: 'scores[]',
        acceptableMethods: [
          'number\\.(int|float)',
          'helpers\\.(arrayElement|arrayElements)',
        ],
      },
    ],
  },
};

const enumPatterns: MockDataUseCase = {
  name: 'enum-patterns',
  tags: ['enum', 'sampleValues'],
  input: {
    databaseName: 'testdb',
    collectionName: 'tasks',
    schema: {
      status: {
        type: 'string',
        sampleValues: ['active', 'inactive', 'pending'],
      },
      priority: { type: 'string', sampleValues: ['low', 'medium', 'high'] },
      color: { type: 'string', sampleValues: ['red', 'green', 'blue'] },
      rating: { type: 'number', sampleValues: [1, 2, 3, 4, 5] },
    },
  },
  expected: {
    fieldMappings: [
      { fieldPath: 'status', acceptableMethods: ['helpers\\.arrayElement'] },
      { fieldPath: 'priority', acceptableMethods: ['helpers\\.arrayElement'] },
      {
        fieldPath: 'color',
        acceptableMethods: ['helpers\\.arrayElement', 'color\\.human'],
      },
      {
        fieldPath: 'rating',
        acceptableMethods: ['number\\.int', 'helpers\\.arrayElement'],
      },
    ],
  },
};

const validationRules: MockDataUseCase = {
  name: 'validation-rules',
  tags: ['validation'],
  input: {
    databaseName: 'testdb',
    collectionName: 'accounts',
    schema: {
      username: { type: 'string' },
      age: { type: 'number' },
      score: { type: 'Decimal128' },
    },
    validationRules: {
      $jsonSchema: {
        properties: {
          username: { bsonType: 'string', minLength: 3, maxLength: 20 },
          age: { bsonType: 'int', minimum: 18, maximum: 120 },
          score: { bsonType: 'decimal', minimum: 0, maximum: 100 },
        },
      },
    },
  },
  expected: {
    fieldMappings: [
      {
        fieldPath: 'username',
        acceptableMethods: [
          'internet\\.userName',
          'person\\.(firstName|lastName)',
          'string\\.(alpha|alphanumeric)',
        ],
      },
      { fieldPath: 'age', acceptableMethods: ['number\\.int'] },
      {
        fieldPath: 'score',
        acceptableMethods: ['number\\.float', 'finance\\.amount'],
      },
    ],
  },
};

function buildLargeSchema(): {
  schema: RawSchema;
  fieldMappings: MockDataEvalCaseExpected['fieldMappings'];
} {
  const schema: RawSchema = {};
  const fieldMappings: MockDataEvalCaseExpected['fieldMappings'] = [];

  const stringFields = [
    { key: 'firstName', methods: ['person\\.firstName'] },
    { key: 'lastName', methods: ['person\\.lastName'] },
    { key: 'email', methods: ['internet\\.email'] },
    { key: 'phone', methods: ['phone\\.number'] },
    { key: 'city', methods: ['location\\.city'] },
    { key: 'country', methods: ['location\\.country'] },
    { key: 'company', methods: ['company\\.name'] },
    { key: 'jobTitle', methods: ['person\\.jobTitle'] },
    { key: 'url', methods: ['internet\\.url'] },
    {
      key: 'bio',
      methods: ['lorem\\.(sentence|paragraph|words|word)'],
    },
  ];

  for (const { key, methods } of stringFields) {
    schema[key] = { type: 'string' };
    fieldMappings.push({ fieldPath: key, acceptableMethods: methods });
  }

  for (let i = 0; i < 10; i++) {
    const key = `metric_${i}`;
    schema[key] = { type: 'number' };
    fieldMappings.push({
      fieldPath: key,
      acceptableMethods: [
        'number\\.(int|float)',
        'commerce\\.price',
        'finance\\.amount',
      ],
    });
  }

  for (let i = 0; i < 5; i++) {
    const key = `date_${i}`;
    schema[key] = { type: 'Date' };
    fieldMappings.push({
      fieldPath: key,
      acceptableMethods: [
        'date\\.(recent|past|future|anytime|soon|between|birthdate)',
      ],
    });
  }

  for (let i = 0; i < 4; i++) {
    const key = `flag_${i}`;
    schema[key] = { type: 'boolean' };
    fieldMappings.push({
      fieldPath: key,
      acceptableMethods: ['datatype\\.boolean'],
    });
  }

  schema['_id'] = { type: 'ObjectId' };
  fieldMappings.push({
    fieldPath: '_id',
    acceptableMethods: ['database\\.mongodbObjectId'],
  });
  schema['refId'] = { type: 'ObjectId' };
  fieldMappings.push({
    fieldPath: 'refId',
    acceptableMethods: ['database\\.mongodbObjectId'],
  });

  // Total: 10 + 10 + 5 + 4 + 2 = 31 fields
  return { schema, fieldMappings };
}

const largeSchemaData = buildLargeSchema();

const largeSchemaBatching: MockDataUseCase = {
  name: 'large-schema-batching',
  tags: ['batching', 'large'],
  input: {
    databaseName: 'testdb',
    collectionName: 'large_collection',
    schema: largeSchemaData.schema,
  },
  expected: {
    fieldMappings: largeSchemaData.fieldMappings,
  },
};

const mockDataUseCases: MockDataUseCase[] = [
  basicTypes,
  semanticFields,
  mongodbSpecific,
  nestedStructures,
  enumPatterns,
  validationRules,
  largeSchemaBatching,
];

export function generateMockDataEvalCases() {
  return mockDataUseCases.map(({ name, tags, input, expected }) => ({
    name,
    tags,
    input,
    expected,
  }));
}
