export {
  mockDataSchemaToolSchema,
  fakerFieldSchema,
  type MockDataSchemaToolOutput,
  type MockDataSchemaRawField,
  type RawSchema,
  // Backwards compatibility: remove once CLOUDP-381919 updates atlas-ai-service.ts to import the new names above.
  MockDataSchemaResponseShape,
  type MockDataSchemaResponse,
} from './schema';

export { MOCK_DATA_SCHEMA_PROMPT } from './prompt';

export { formatSchemaForPrompt } from './format-schema-for-prompt';

export {
  splitSchemaIntoChunks,
  mergeChunkResponses,
  validateSchemaSize,
  needsBatching,
  FIELDS_PER_CHUNK,
  MAX_CHUNKS,
} from './schema-batching';
