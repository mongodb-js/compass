import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';
import type { MongoDBFieldType } from '@mongodb-js/compass-generative-ai';

export type FakerArg = string | number | boolean | { json: string };

export enum MockDataGeneratorStep {
  SCHEMA_CONFIRMATION = 'SCHEMA_CONFIRMATION',
  SCHEMA_EDITOR = 'SCHEMA_EDITOR',
  DOCUMENT_COUNT = 'DOCUMENT_COUNT',
  PREVIEW_DATA = 'PREVIEW_DATA',
  GENERATE_DATA = 'GENERATE_DATA',
}

type MockDataGeneratorIdleState = {
  status: 'idle';
};

type MockDataGeneratorInProgressState = {
  status: 'in-progress';
  requestId: string;
};

type MockDataGeneratorCompletedState = {
  status: 'completed';
  fakerSchema: FakerSchema;
  requestId: string;
};

type MockDataGeneratorErrorState = {
  status: 'error';
  error: unknown;
  requestId: string;
};

export type MockDataGeneratorState =
  | MockDataGeneratorIdleState
  | MockDataGeneratorInProgressState
  | MockDataGeneratorCompletedState
  | MockDataGeneratorErrorState;

// LLM output format (array with fieldPath as property)
export type LlmFakerMapping = MockDataSchemaResponse['fields'][number];

// Processed format (object value without fieldPath)
export interface FakerFieldMapping {
  mongoType: MongoDBFieldType;
  fakerMethod: string;
  fakerArgs: FakerArg[];
  probability?: number; // 0.0 - 1.0 frequency of field (defaults to 1.0)
}

// Optimized object format (fieldPath as key, FakerFieldMapping as value)
export type FakerSchema = Record<string, FakerFieldMapping>;

/**
 * The faker schema is validated if it has been (1) confirmed by the user and
 * (2) TODO(CLOUDP-333855): pre-processed to prevent harmful calls like those that
 * block the main thread or cause out of memory errors
 */
export type ValidatedFakerSchema = FakerSchema & {
  readonly __brand: unique symbol;
};
