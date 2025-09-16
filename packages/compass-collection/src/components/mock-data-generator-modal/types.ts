import type { MockDataSchemaResponse } from '@mongodb-js/compass-generative-ai';

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
  fakerSchema: FakerSchemaMapping[];
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

export type FakerSchemaMapping = MockDataSchemaResponse['fields'][number];

/**
 * The faker schema mapping is validated if it has been (1) confirmed by the user and
 * (2) TODO(CLOUDP-333855): pre-processed to prevent harmful calls like those that
 * block the main thread or cause out of memory errors
 */
export type ValidatedFakerSchemaMapping = FakerSchemaMapping & {
  readonly __brand: unique symbol;
};
