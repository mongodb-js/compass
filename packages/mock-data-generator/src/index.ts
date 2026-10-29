import * as scriptGenerationUtils from './script-generation-utils';

// Assigned rather than re-exported with `export { x } from './y'`: that form compiles to a
// non-configurable getter, which consumers' tests cannot stub.
export const generateScript = scriptGenerationUtils.generateScript;
export const generateDocument = scriptGenerationUtils.generateDocument;
export const getDefaultFakerMethod =
  scriptGenerationUtils.getDefaultFakerMethod;
export const formatFakerArgs = scriptGenerationUtils.formatFakerArgs;

export type { ScriptResult } from './script-generation-utils';

export { UNRECOGNIZED_FAKER_METHOD } from './types';

export type {
  ArrayLengthMap,
  FakerArg,
  FakerFieldMapping,
  FakerSchema,
  MongoDBFieldType,
  ScriptOptions,
} from './types';

export {
  mockDataSchemaToolSchema,
  fakerFieldSchema,
  type MockDataSchemaToolOutput,
  type MockDataSchemaRawField,
  type RawSchema,
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
