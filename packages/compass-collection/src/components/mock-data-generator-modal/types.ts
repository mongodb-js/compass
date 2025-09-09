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
  fakerSchema: Array<FakerSchemaMapping>;
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

export type FakerSchemaMapping = {
  fieldPath: string;
  mongoType: string;
  fakerMethod: string;
  fakerArgs: Array<
    | string
    | number
    | boolean
    | {
        json: string;
      }
  >;
  isArray: boolean;
  probability: number;
};
