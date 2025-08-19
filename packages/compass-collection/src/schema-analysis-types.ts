import type { Document } from 'mongodb';

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

export interface FieldInfo {
  type: string; // MongoDB type (eg. String, Double, Array, Document)
  sample_values?: unknown[]; // Primitive sample values (flattened for arrays)
  array_sample_values?: unknown[]; // Sample values of the top-level array object
  probability?: number; // 0.0 - 1.0 field frequency
}

export type SchemaAnalysisCompletedState = {
  status: typeof SCHEMA_ANALYSIS_STATE_COMPLETE;
  processedSchema: Record<string, FieldInfo>;
  sampleDocument: Document;
  schemaMetadata: {
    maxNestingDepth: number;
    validationRules: Document | null;
  };
};

export type SchemaAnalysisState =
  | SchemaAnalysisInitialState
  | SchemaAnalysisStartedState
  | SchemaAnalysisCompletedState
  | SchemaAnalysisErrorState;
