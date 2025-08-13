import { type Schema } from 'mongodb-schema';

export const SCHEMA_ANALYSIS_STATE_INITIAL = 'initial';
export const SCHEMA_ANALYSIS_STATE_ANALYZING = 'analyzing';
export const SCHEMA_ANALYSIS_STATE_COMPLETE = 'complete';
export const SCHEMA_ANALYSIS_STATE_ERROR = 'error';

export type SchemaAnalysisStatus =
  | typeof SCHEMA_ANALYSIS_STATE_INITIAL
  | typeof SCHEMA_ANALYSIS_STATE_ANALYZING
  | typeof SCHEMA_ANALYSIS_STATE_COMPLETE
  | typeof SCHEMA_ANALYSIS_STATE_ERROR;

export type SchemaAnalysisInitialState = {
  status: typeof SCHEMA_ANALYSIS_STATE_INITIAL;
};

export type SchemaAnalysisStartedState = {
  status: typeof SCHEMA_ANALYSIS_STATE_ANALYZING;
};

export type SchemaAnalysisError = {
  errorMessage: string;
  errorType: 'timeout' | 'highComplexity' | 'general';
};

export type SchemaAnalysisErrorState = {
  status: typeof SCHEMA_ANALYSIS_STATE_ERROR;
  error: SchemaAnalysisError;
};

export type SchemaAnalysisCompletedState = {
  status: typeof SCHEMA_ANALYSIS_STATE_COMPLETE;
  schema: Schema;
  sampleDocument: Document;
  schemaMetadata: {
    maxNestingDepth: number;
    validationRules: Document | null;
  };
};

export type SchemaAnalysisState =
  | SchemaAnalysisErrorState
  | SchemaAnalysisInitialState
  | SchemaAnalysisStartedState
  | SchemaAnalysisCompletedState;
