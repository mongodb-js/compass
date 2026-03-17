import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';
import type { FakerArg } from './script-generation-utils';
import type { MongoDBFieldType } from '../../schema-analysis-types';

export const MockDataGeneratorSteps = {
  SCHEMA_CONFIRMATION: 'SCHEMA_CONFIRMATION',
  PREVIEW_AND_DOC_COUNT: 'PREVIEW_AND_DOC_COUNT',
  SCRIPT_RESULT: 'SCRIPT_RESULT',
} as const;

export type MockDataGeneratorStep =
  (typeof MockDataGeneratorSteps)[keyof typeof MockDataGeneratorSteps];

type MockDataGeneratorIdleState = {
  status: 'idle';
};

type MockDataGeneratorInProgressState = {
  status: 'in-progress';
  requestId: string;
};

type MockDataGeneratorCompletedState = {
  status: 'completed';
  fakerSchema: Readonly<FakerSchema>;
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

export const DataGenerationSteps = {
  INSTALL_FAKERJS: 'install fakerjs',
  CREATE_JS_FILE: 'create js file',
  RUN_SCRIPT: 'mongosh script',
} as const;

export type DataGenerationStep =
  (typeof DataGenerationSteps)[keyof typeof DataGenerationSteps];
