import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';
import type { FakerArg } from './script-generation-utils';
import type { MongoDBFieldType } from '../../schema-analysis-types';

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

export type LlmFakerMapping = MockDataSchemaResponse['fields'][number];

export interface FakerFieldMapping {
  mongoType: MongoDBFieldType;
  fakerMethod: string;
  fakerArgs: FakerArg[];
  probability?: number; // 0.0 - 1.0 frequency of field (defaults to 1.0)
}

export type FakerSchema = Record<string, FakerFieldMapping>;
