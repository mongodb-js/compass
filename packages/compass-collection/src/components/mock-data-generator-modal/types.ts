import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

export enum MockDataGeneratorStep {
  AI_DISCLAIMER = 'AI_DISCLAIMER',
  SCHEMA_CONFIRMATION = 'SCHEMA_CONFIRMATION',
  SCHEMA_EDITOR = 'SCHEMA_EDITOR',
  DOCUMENT_COUNT = 'DOCUMENT_COUNT',
  PREVIEW_DATA = 'PREVIEW_DATA',
  GENERATE_DATA = 'GENERATE_DATA',
}

type MockDataGeneratorIdleState = {
  status: 'idle';
};

type MockDataGeneratorGeneratingState = {
  status: 'generating';
  requestId: string;
};

type MockDataGeneratorCompletedState = {
  status: 'completed';
  fakerSchema: MockDataSchemaResponse;
  requestId: string;
};

type MockDataGeneratorErrorState = {
  status: 'error';
  error: unknown;
  requestId: string;
};

export type MockDataGeneratorState =
  | MockDataGeneratorIdleState
  | MockDataGeneratorGeneratingState
  | MockDataGeneratorCompletedState
  | MockDataGeneratorErrorState;
