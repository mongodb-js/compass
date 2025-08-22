import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

export const MOCK_DATA_GENERATOR_STATE_IDLE = 'idle';
export const MOCK_DATA_GENERATOR_STATE_GENERATING = 'generating';
export const MOCK_DATA_GENERATOR_STATE_COMPLETED = 'completed';
export const MOCK_DATA_GENERATOR_STATE_ERROR = 'error';

type MockDataGeneratorIdleState = {
  status: typeof MOCK_DATA_GENERATOR_STATE_IDLE;
};

type MockDataGeneratorGeneratingState = {
  status: typeof MOCK_DATA_GENERATOR_STATE_GENERATING;
  requestId: string;
};

type MockDataGeneratorCompletedState = {
  status: typeof MOCK_DATA_GENERATOR_STATE_COMPLETED;
  fakerSchema: MockDataSchemaResponse;
  requestId: string;
};

type MockDataGeneratorErrorState = {
  status: typeof MOCK_DATA_GENERATOR_STATE_ERROR;
  error: unknown;
  requestId: string;
};

export type MockDataGeneratorState =
  | MockDataGeneratorIdleState
  | MockDataGeneratorGeneratingState
  | MockDataGeneratorCompletedState
  | MockDataGeneratorErrorState;
