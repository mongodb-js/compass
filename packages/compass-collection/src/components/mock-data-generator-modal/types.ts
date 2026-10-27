import type { MockDataSchemaToolOutput } from '@mongodb-js/mock-data-generator';
import type {
  FakerFieldMapping,
  FakerSchema,
} from '@mongodb-js/mock-data-generator';

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

export type LlmFakerMapping = MockDataSchemaToolOutput['fields'][number];

export type { FakerFieldMapping, FakerSchema };

export const DataGenerationSteps = {
  INSTALL_FAKERJS: 'install fakerjs',
  CREATE_JS_FILE: 'create js file',
  RUN_SCRIPT: 'mongosh script',
} as const;

export type DataGenerationStep =
  (typeof DataGenerationSteps)[keyof typeof DataGenerationSteps];
